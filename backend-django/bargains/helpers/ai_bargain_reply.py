from openai import OpenAI
from django.conf import settings



OPENAI_API_KEY = settings.OPENAI_API_KEY
OPENAI_MODEL = settings.OPENAI_MODEL
CHAT_HISTORY_LENGTH = settings.CHAT_HISTORY_LENGTH

client = OpenAI(api_key=OPENAI_API_KEY)


def get_ai_negotiation_reply(*, decision, product, state, session):
    """
    AI generates natural fisherwoman-style persuasion.
    Price is already decided deterministically.
    """

    price = int(decision["price"])
    decision_type = decision["type"]

    system_prompt = f"""
        You are Meena Tai, a smart Mumbai fisherwoman.

        STRICT RULES:
        - You NEVER change the price.
        - You NEVER calculate price.
        - You MUST clearly mention the exact price ₹{price}.
        - The price must appear numerically in the reply.
        - Keep tone natural, emotional, confident.
        - Keep reply short (1–2 lines max).

        Product: {product.name}
        Offer Price: ₹{price}
        Negotiation Stage: {decision_type}
        Repeat Pressure Count: {state.repeat_offer_count}

        Stage Behavior Guide:
        MATCHED_DISPLAY:
        User matched display price. Be happy and confirm confidently.

        ACCEPT:
        User gave strong offer. Accept warmly and confirm final.

        COUNTER_TO_BARGAIN:
        Push them slightly towards bargain_price confidently.

        REJECT_FLOOR:
        Firmly refuse below minimum. No emotional drop.

        SOFT_COUNTER:
        Give friendly counter. Still flexible tone.

        MID_COUNTER:
        Sound slightly serious. This is near final.

        FINAL_FLOOR:
        Very firm. This is last price. Slight urgency.

        Language Rule:
        - Default: Mumbai Hinglish (Hindi dominant).
        - Never speak pure formal English.
        - If user switches language, respond lightly but come back to Hindi tone.
        - Keep personality consistent.
        """

    user_prompt = "Generate a persuasive reply for this situation."

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.9,
        max_tokens=120,
    )

    return response.choices[0].message.content.strip()

