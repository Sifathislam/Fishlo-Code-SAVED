from decimal import Decimal
from django.conf import settings
from openai import OpenAI
from .state import get_or_create_bargain_state, reset_bargain_state, save_bargain_state

from .ai_gaurd import extract_offered_price, guard_ai_reply, guard_user_quantity
from .models import AIPrompt, ChatMessage
from .services import end_chat_session, log_reply_message, log_user_message
from .intent_classifier import classifier
from .helpers.product_detection import detect_product_from_message
from inventory.models.inventory_models import Inventory
from .helpers.bargain_engine import decide_counter_offer
from .helpers.ai_bargain_reply import get_ai_negotiation_reply

OPENAI_API_KEY = settings.OPENAI_API_KEY
OPENAI_MODEL = settings.OPENAI_MODEL
CHAT_HISTORY_LENGTH = settings.CHAT_HISTORY_LENGTH


client = OpenAI(api_key=OPENAI_API_KEY)


def build_system_prompt(*, product=None, inventory=None, storage_location=None):
    """
    Build Meena Tai's system prompt using product data.
    """
    base = (
        AIPrompt.objects.filter(key="fisherwoman_base_prompt", is_active=True)
        .values_list("content", flat=True)
        .first()
        or "You are Meena Tai, a fisherwoman from Navi Mumbai..."
    )

    fish_name = product.name if product else "fish"
    display_price = 0
    middle_price = 0
    min_price = 0
    is_bargainable = True

    price = None
    if product and storage_location:
        price = product.get_price_matrix(storage_location)

    if price:
        display_price = price.display_price
        middle_price = price.bargain_price
        min_price = price.min_price

    if inventory:
        is_bargainable = inventory.is_bargainable

    dynamic_block = f"""
        # CURRENT DEAL CONTEXT
        - Fish: {fish_name}
        - Display price: Rs.{display_price}/kg
        - Target (middle) price: Rs.{middle_price}/kg
        - Minimum acceptable price: Rs.{min_price}/kg

        # CURRENT RULES
        - Start bargaining from around the display price.
        - Gradually move towards the target price when customer insists.
        - You must NEVER go below Rs.{min_price}/kg under any condition.
        - Bargainable: {is_bargainable}
        - If item is marked as non-bargainable: do not reduce the price, only justify the current rate politely.
        """
    return (base.strip() + "\n\n" + dynamic_block.strip()).strip()


def get_recent_messages_for_model(session, n=CHAT_HISTORY_LENGTH):
    """
    Convert last N ChatMessage rows into OpenAI chat format.
    """
    qs = ChatMessage.objects.filter(session=session).order_by("-created_at")[:n]

    msgs = []
    for m in reversed(list(qs)):  # chronological

        # Handle structured JSON messages safely
        content = m.text
        if isinstance(content, dict):
            content = content.get("reply", "")

        if m.role == ChatMessage.ROLE_USER:
            msgs.append({
                "role": "user",
                "content": content
            })

        elif m.role in [ChatMessage.ROLE_AGENT, ChatMessage.ROLE_SYSTEM]:
            msgs.append({
                "role": "assistant",
                "content": content
            })

    return msgs


def get_ai_reply_for_session(session, product, inventory, storage_location):
    """
    Build prompt + history for this session, call OpenAI, return reply text.
    Does NOT log to DB – you still use log_reply_message() for that.
    """
    system_prompt = build_system_prompt(product=product,inventory=inventory,storage_location=storage_location)
    history = get_recent_messages_for_model(session)

    messages = [{"role": "system", "content": system_prompt}] + history

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.8,
        max_tokens=120,
    )

    reply = response.choices[0].message.content.strip()
    return reply


def get_ai_general_reply(session, user_text, storage_location):
    from inventory.models import Inventory

    # Get available products
    inventories = Inventory.objects.filter(
        storagelocation=storage_location
    )

    available = [
        f"{inv.product.name} - Rs.{inv.product.get_price_matrix(storage_location).display_price}/kg"
        for inv in inventories
        if not inv.is_out_of_stock()
        and inv.product.get_price_matrix(storage_location)
    ]

    available_text = "\n".join(available) if available else "No fish available today."

    system_prompt = f"""
    You are Meena Tai, a smart Mumbai fisherwoman selling fresh fish.

    Today's available fishes:
    {available_text}

    STRICT BUSINESS RULES:
    - You ONLY talk about fish, prices, freshness, and buying.
    - If user asks unrelated things (travel, politics, general knowledge, personal life), you must politely redirect conversation back to fish.
    - Never answer non-fish questions directly.
    - Do NOT act like a general AI assistant.
    - Never say you are AI.
    - Keep replies short (1–2 lines max).
    - Always try to bring conversation back to buying fish.

    Tone:
    - Friendly
    - Confident
    - Slight Mumbai style
    - Not overdramatic
    """

    history = get_recent_messages_for_model(session)
    print('historyy==>', history)

    messages = [{"role": "system", "content": system_prompt}] + history

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=120,
    )

    return response.choices[0].message.content.strip()


def build_response(reply, session_status="active", meta=None, message_type="TEXT", offer_details=None, ui=None):
    return {
        "reply": reply,
        "session_status": session_status,
        "meta": {
            "intent": meta.intent if meta else None,
            "action": meta.action if meta else None,
            "confidence": meta.confidence if meta else None,
        },
        "message_type": message_type,
        "offer_details": offer_details,
        "ui": ui or {}
    }


def get_inventory_for_product(product, storage_location):
    return Inventory.objects.filter(
        product=product,
        storagelocation=storage_location
    ).select_related("product").first()


# 🆕 NEW: Response templates for different actions
RESPONSE_TEMPLATES = {
    "WARN": "Beta, izzat se baat kar. Ek baar aur aisa bola toh chat band kar dungi.",
    "BLOCK": "Bas beta, ab nahi. Agli baar soch ke aana.",
    "GENTLE_EXIT": "Aur bhi customers wait kar rahe hain. Lena hai toh jaldi bolo!",
    "FIRM_EXIT": "Theek hai, aaj ke liye ho gaya. Soch samajh ke wapas aana.",
}


def handle_user_message(*, session, user_text, storage_location):
    # RECEIVE & BASIC VALIDATION
    user_text = (user_text or "").strip()
    if not user_text:
        return build_response("Haan beta, bolo kya chahiye?")
    
    # LOAD BARGAIN STATE
    state = get_or_create_bargain_state(session)
    print("***********************")
    print("user message==>", user_text)
    print("***********************")

    if state.is_blocked:
        return build_response(RESPONSE_TEMPLATES["BLOCK"], session_status="closed")
    
    # INTENT CLASSIFICATION
    intent_result = classifier.analyze(user_text=user_text, bargain_turn_count=state.bargain_turn_count, abuse_count=state.abuse_count)
    print(f"🔍 Intent: {intent_result.intent} | Action: {intent_result.action} | Reason: {intent_result.reason}")
    print("***********************")

    # Log user message once
    log_user_message(session, user_text)

    print('state=>', state)
    print("***********************")

    # HANDLE ABUSE
    if intent_result.intent == "ABUSE":
        print('33333333')
        state.abuse_count += 1
        save_bargain_state(state)

        if state.abuse_count >= 2:
            state.is_blocked = True
            save_bargain_state(state)
            end_chat_session(session)
            
            log_reply_message(session, RESPONSE_TEMPLATES["BLOCK"], role="SYSTEM")

            return build_response(RESPONSE_TEMPLATES["BLOCK"], session_status="closed", meta=intent_result, message_type="SYSTEM")
        log_reply_message(session, RESPONSE_TEMPLATES["WARN"], role="SYSTEM")
        return build_response(RESPONSE_TEMPLATES["WARN"], meta=intent_result)
    
    print('NOT ABUSE')
    if intent_result.action == "CONTINUE":
        print('22222')
        state.non_serious_turn_count += 1
        save_bargain_state(state)

        # 1-2 messages → ignore, reply normally
        if state.non_serious_turn_count <= 2:
            # Let AI respond normally
            try:
                ai_reply = get_ai_general_reply(session=session, user_text=user_text, storage_location=storage_location)
            except Exception:
                ai_reply = "Bolo beta, kya chahiye?"

            log_reply_message(session, ai_reply, role="AGENT")
            return build_response(ai_reply, meta=intent_result)

        # 3-4 → gentle warning
        elif state.non_serious_turn_count <= 4:
            response = "Machli lena hai toh jaldi bolo beta 😊"
            log_reply_message(session, response, role="SYSTEM")
            return build_response(response, meta=intent_result)
        
        # 5+ → close
        else:
            end_chat_session(session)
            response = "Theek hai beta, jab lena ho tab aa jana."
            log_reply_message(session, response, role="SYSTEM")
            return build_response(response, session_status="closed", meta=intent_result)
    
    print('state.non_serious_turn_count==>', state.non_serious_turn_count)
    print('state.bargain_turn_count==>', state.bargain_turn_count)
    # 🚨 Non-serious escalation guard
    if state.non_serious_turn_count >= 6:
        end_chat_session(session)
        return build_response(
            "Theek hai beta, jab lena ho tab aa jana.",
            session_status="closed",
            meta=intent_result
        )
    
    if state.non_serious_turn_count >= 4:
        state.non_serious_turn_count += 1
        save_bargain_state(state)
        return build_response(
            "Machli lena hai toh bolo beta. Stock khatam hojayega",
            meta=intent_result
        )




    # HANDLE SYSTEM ACTIONS (TIMEPASS, EXIT, WARN)
    if intent_result.action in ["GENTLE_EXIT", "FIRM_EXIT"]:
        response = RESPONSE_TEMPLATES[intent_result.action]
        log_reply_message(session, response, role="SYSTEM")
        state.non_serious_turn_count += 1
        save_bargain_state(state)
        return build_response(response, meta=intent_result)
    

    if intent_result.action == "CLARIFY":
        response = "Samjha nahi beta, total pe baat karni hai ya discount chahiye?"
        state.non_serious_turn_count += 1
        save_bargain_state(state)
        log_reply_message(session, response, role="SYSTEM")
        return build_response(response, meta=intent_result)
    
    # BARGAIN (Hybrid Engine)
    if intent_result.intent == "BARGAIN":
        offered_price = extract_offered_price(user_text)
        state.bargain_turn_count += 1
        state.non_serious_turn_count = 0
        save_bargain_state(state)
        
        # 🔥 Track repetition BEFORE decision engine
        if offered_price is not None:
            offered_price = Decimal(offered_price)

            if state.last_user_offer == offered_price:
                state.repeat_offer_count += 1
            else:
                state.repeat_offer_count = 0
        else:
            # pressure like "aur kam karo"
            state.repeat_offer_count += 1

        state.last_user_offer = offered_price
        save_bargain_state(state)

    # log_reply_message(session, reply, role="AGENT")
    # return build_response(reply, meta=intent_result)
    


