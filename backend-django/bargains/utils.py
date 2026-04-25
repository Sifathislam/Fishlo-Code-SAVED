import re



def is_walkaway(text: str) -> bool:
    t = (text or "").lower()
    keys = [
        "nahi chahiye",
        "rehne do",
        "dusre jagah",
        "dusri jagah",
        "mat chahiye",
        "cancel",
    ]
    return any(k in t for k in keys)


