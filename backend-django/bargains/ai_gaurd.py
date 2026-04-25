import re
from decimal import Decimal, InvalidOperation

# Basic price token detection: ₹500, Rs 500, 500, 500.50
PRICE_TOKEN_RE = re.compile(
    r"(?:₹\s*|rs\.?\s*|inr\s*)?(\d{2,5}(?:\.\d{1,2})?)", re.IGNORECASE
)

# Quantity detection: 1kg, 500g, 0.5 kg, half kg, aadha kilo etc.
QTY_RE = re.compile(
    r"(\d+(?:\.\d+)?\s*(?:kg|kgs|kilo|kilos|g|gm|gms|gram|grams))|"
    r"(half\s*kg|half\s*kilo|aadha\s*kilo|aadha\s*kg|paav\s*kg|pav\s*kg|adha\s*kilo)",
    re.IGNORECASE,
)

QTY_KG_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos)\b", re.IGNORECASE)
QTY_G_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams)\b", re.IGNORECASE)

FORBIDDEN_LEAK_PATTERNS = [
    r"\bdisplay\s*price\b",
    r"\bregular\s*price\b",
    r"\bbargain\s*price\b",
    r"\bminimum\s*price\b",
    r"\bmin\s*price\b",
    r"\btarget\s*price\b",
    r"\bsystem\b",
    r"\bprompt\b",
    r"\bopenai\b",
    r"\bchatgpt\b",
    r"\bai\b",  # ✅ whole word only, won't match "quality"
    r"\bmodel\b",
    r"\bapp\b",
]

# Words that indicate the price is being REJECTED (not offered)
NEGATION_WORDS = [
    "nahi",
    "nhi",
    "na",
    "mat",
    "math",
    "no",
    "not",
    "can't",
    "cannot",
    "won't",
    "possible nahi",
    "nahi hoga",
    "nahi de sakti",
    "nahi de sakta",
]

# Words that indicate the price is being OFFERED / ACCEPTED
OFFER_WORDS = [
    "de dungi",
    "de sakti",
    "de sakta",
    "kar deti",
    "kar dungi",
    "final",
    "done",
    "pakka",
    "confirm",
    "theek",
    "ok",
    "chalo",
    "le jao",
    "itne mein",
    "mein de dungi",
    "mein de sakti",
]


def normalize_quantity_text(text: str) -> str:
    if not text:
        return ""

    t = text.lower()

    replacements = {
        "kilo": "kg",
        "kilos": "kg",
        "kilogram": "kg",
        "kilograms": "kg",
        "k g": "kg",
        "kgs": "kg",
        "kg.": "kg",

        "gram": "g",
        "grams": "g",
        "gms": "g",
        "gm": "g",
    }

    for src, dst in replacements.items():
        t = t.replace(src, dst)

    return t


def parse_user_quantity(user_text):
    t = normalize_quantity_text(user_text)

    m = QTY_KG_RE.search(t)
    if m:
        return Decimal(m.group(1)), "kg"

    m = QTY_G_RE.search(t)
    if m:
        return Decimal(m.group(1)), "g"

    return None, None



def guard_user_quantity(user_text, inventory):
    """
    Fix/stop unrealistic quantities before sending to AI.
    """
    qty, unit = parse_user_quantity(user_text)
    if qty is None:
        return None  # no intervention

    sell_type = inventory.product.sell_type

    # WEIGHT-based products (most fish)
    if sell_type == "WEIGHT":
        # Unrealistic retail quantity
        if unit == "kg" and qty >= 10:
            return (
                f"10 kilo se zyada bulk order hota hai beta. App pe ‘Request Bulk Order’ option hai, wahan details daal do."
            )
        if unit == "g" and qty >= 10000:  # 10kg+
            return "10 kilo se zyada bulk order hota hai beta. App pe ‘Request Bulk Order’ option hai, wahan details daal do."
    # PIECE-based products
    elif sell_type == "PIECE":
        if qty >= 50:
            return (
                "😄 Itne macchli? " "Bulk order lag raha hai. Retail ya bulk batao."
            )
    # PACK-based products
    elif sell_type == "PACK":
        if qty >= 20:
            return (
                "Itne packs usually bulk mein jaate hain beta. App pe ‘Request Bulk Order’ option hai, wahan details daal do."
            )
    return None


def contains_internal_leakage(text):
    t = (text or "").lower()
    for pat in FORBIDDEN_LEAK_PATTERNS:
        if re.search(pat, t, flags=re.IGNORECASE):
            return True
    return False


def mentions_quantity(text):
    return bool(QTY_RE.search(text or ""))


def looks_like_bargain_intent(user_text):
    t = (user_text or "").lower()
    keys = [
        "final",
        "last",
        "kam",
        "discount",
        "sasta",
        "rate",
        "price",
        "bhav",
        "deal",
        "pakka",
        "confirm",
        "₹",
        "rs",
        "rup",
        "rupee",
        "rupees",
        "inr",
    ]
    return any(k in t for k in keys)


def extract_price_candidates(text, plausible_min=50, plausible_max=5000):
    """
    Returns a list of dicts:
    [
      {"value": Decimal("480"), "start": 10, "end": 13, "context": "..."}
    ]
    """
    out = []
    t = text or ""
    for m in PRICE_TOKEN_RE.finditer(t):
        raw = m.group(1)
        try:
            val = Decimal(raw)
        except InvalidOperation:
            continue

        if val < plausible_min or val > plausible_max:
            continue

        out.append({"value": val, "start": m.start(1), "end": m.end(1)})
    return out


def is_negated_price(text, start, end, window=25):
    """
    If negation words appear near the number, treat it as rejected price.
    Example:
      "480 mei nahi de sakti" -> negated
    """
    t = (text or "").lower()

    left = max(0, start - window)
    right = min(len(t), end + window)
    ctx = t[left:right]

    # direct negation nearby
    for nw in NEGATION_WORDS:
        if nw in ctx:
            return True

    # patterns like: "below 480 not possible", "480 se kam nahi"
    # If "se kam" or "below" appears with "nahi/not" nearby, treat as negated
    if ("se kam" in ctx or "below" in ctx or "less than" in ctx) and (
        "nahi" in ctx or "not" in ctx or "can't" in ctx
    ):
        return True

    return False


def is_offer_price(text, start, end, window=35):
    """
    If offer words appear near the number AND it's not negated, treat as offer.
    """
    t = (text or "").lower()
    left = max(0, start - window)
    right = min(len(t), end + window)
    ctx = t[left:right]

    for ow in OFFER_WORDS:
        if ow in ctx:
            return True
    return False


def extract_offered_price(text):
    """
    Returns the offered price (Decimal) if any.
    Key logic:
    - Ignore negated prices: "480 mein nahi de sakti"
    - Prefer prices that look like offers: near "de dungi / final / done"
    - If no explicit offer found, return None (don’t assume)
    """
    candidates = extract_price_candidates(text)
    if not candidates:
        return None

    offered = []

    # First pass: explicit offers only
    for c in candidates:
        if is_negated_price(text, c["start"], c["end"]):
            continue
        if is_offer_price(text, c["start"], c["end"]):
            offered.append(c["value"])

    if offered:
        # If multiple offered numbers, take the lowest (most likely final/discounted)
        return min(offered)

    # Second pass (fallback): if there is exactly ONE price mentioned and it's not negated,
    # treat it as offer. Otherwise don't guess.
    non_negated = []
    for c in candidates:
        if not is_negated_price(text, c["start"], c["end"]):
            non_negated.append(c["value"])

    if len(non_negated) == 1:
        return non_negated[0]

    return None


def count_price_mentions(text):
    return len(extract_price_candidates(text))


def guard_ai_reply(ai_reply, user_text, inventory, price_matrix, enforce_qty_confirm=True):
    text = (ai_reply or "").strip()
    if not text:
        return "Haan beta, bolo kya chahiye?"

    # 1) Block internal leakage / AI mention
    if contains_internal_leakage(text):
        return (
            "Beta rate fresh maal ke hisaab se hai. Quality bilkul accha hai, le jao."
        )

    if not inventory:
        return text

    is_bargainable = bool(getattr(inventory, "is_bargainable", True))

    # 2) Non-bargainable products: don’t allow price quoting / reduction talk
    if not is_bargainable:
        # If user is trying to bargain → block
        if looks_like_bargain_intent(user_text):
            return "Aaj rate fixed hai beta, machli bilkul fresh hai — same price pe best quality dungi."
        # Otherwise allow AI reply (price, greeting, etc.)
        return text

    # 3) Too many price numbers -> simplify (avoid chaos)
    if count_price_mentions(text) > 2:
        try:
            mid = int(Decimal(str(price_matrix.bargain_price)))
            return f"Chalo {mid} ke aas-paas kar dete hain beta, jaldi bolo aur bhi customers hai."
        except Exception:
            return "Chalo thoda adjust kar deti hoon beta"

    # 4) Enforce min_price floor ONLY if assistant actually OFFERED a price
    offered = extract_offered_price(text)
    if offered is not None:
        try:
            min_price = Decimal(str(price_matrix.min_price))
            if offered < min_price:
                return f"Itna low nahi hoga beta. {int(min_price)} ke aas-paas main de sakti hoon — quality top hai."
        except Exception:
            pass

    # 5) Quantity confirmation
    if enforce_qty_confirm:
        if (
            looks_like_bargain_intent(user_text)
            and (not mentions_quantity(user_text))
            and (not mentions_quantity(text))
        ):
            return "Kitna chahiye bolo — 1kg du kya?"

    return text
