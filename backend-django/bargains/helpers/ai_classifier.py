# chat/services/ai_moderation.py

from openai import OpenAI
from django.conf import settings

OPENAI_API_KEY = settings.OPENAI_API_KEY
OPENAI_MODEL = settings.OPENAI_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def classify_message_safety(user_text: str) -> dict:
    """
    AI-based moderation layer.
    Returns:
        {
            "label": "CLEAN" | "TIMEPASS" | "SEXUAL" | "HARASSMENT" | "ABUSE",
            "confidence": float
        }
    """

    if not user_text:
        return {"label": "CLEAN", "confidence": 1.0}

    system_prompt = """
    You are a strict moderation classifier for a commercial fish selling platform.

    Classify the user message into ONE of these labels:
    - CLEAN (normal business conversation)
    - TIMEPASS (casual talk, flirting, non-business but not abusive)
    - SEXUAL (sexual talk, double meaning, adult intent)
    - HARASSMENT (targeted inappropriate behavior toward seller)
    - ABUSE (insults, gaali, toxic language)

    Respond ONLY in this JSON format:
    {"label": "LABEL", "confidence": 0.00}
    """

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        temperature=0,
        max_tokens=60,
    )

    raw = response.choices[0].message.content.strip()

    try:
        import json
        result = json.loads(raw)
        return result
    except Exception:
        # fallback safe
        return {"label": "CLEAN", "confidence": 0.5}