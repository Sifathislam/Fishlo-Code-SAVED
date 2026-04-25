from decimal import Decimal

from django.db import models
from django.utils import timezone

from .models import ChatMessage, ChatSession
from inventory.models.inventory_models import Inventory
import random


def start_chat_session(user_profile, storage_location=None, device_type=""):
    """
    Always starts a new chat session
    """
    return ChatSession.objects.create(
        user_profile=user_profile,
        storage_location=storage_location,
        device_type=device_type,
    )


def log_user_message(session, text):
    msg = ChatMessage.objects.create(
        session=session, role=ChatMessage.ROLE_USER, text=text
    )

    # update message count
    ChatSession.objects.filter(id=session.id).update(
        message_count=models.F("message_count") + 1
    )
    return msg


def log_reply_message(session, text, role):
    msg = ChatMessage.objects.create(
        session=session, role=role, text=text
    )

    # update message count
    ChatSession.objects.filter(id=session.id).update(
        message_count=models.F("message_count") + 1
    )
    return msg


def end_chat_session(session):
    """
    Marks a chat session as ended.
    Call this when user exits chat or order is placed.
    """
    session.ended_at = timezone.now()
    session.save(update_fields=["ended_at"])



def generate_initial_greeting(*, session, storage_location, cart_total):
    cart_total = Decimal(cart_total)

    # 🎯 Initial small discount (3%)
    initial_discount = (cart_total * Decimal("0.03")).quantize(Decimal("1"))
    new_total = cart_total - initial_discount

    # Round nicely (optional)
    new_total = int(round(new_total, -1))  # round to nearest 10
    cart_total = int(cart_total)

    templates = [
        f"Acha selection hai! Total ₹{cart_total} ho raha hai. Chalo ₹{new_total} de do.",
        f"Arre wah beta 😄 ₹{cart_total} ka cart bana diya. ₹{new_total} kar deti hoon.",
        f"Pura cart ₹{cart_total} ka hai… tumhare liye ₹{new_total} kar diya.",
        f"Dekho beta, ₹{cart_total} ho raha hai. ₹{new_total} de do.",
        f"Fresh machali select kiye ho. Total ₹{cart_total}. ₹{new_total} mein nipta dete hain.",
        f"₹{cart_total} ho raha hai sab mila ke. ₹{new_total} de do.",
        f"Cart dekh ke maza aa gaya 😄 ₹{cart_total} ka hai. ₹{new_total} final de do.",
        f"Sab mila ke ₹{cart_total} banta hai. Chalo ₹{new_total} mein le jao.",
        f"₹{cart_total} ka hisaab ho raha hai… ₹{new_total} mei de dungi or kya chahiye."
    ]

    reply = random.choice(templates)
    
    return {
        "reply": reply,
        "offer_details": {
            "original_total": cart_total,
            "counter_total": new_total,
            "discount": cart_total - new_total
        }
    }