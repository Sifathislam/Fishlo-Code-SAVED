from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from django import template

register = template.Library()


@register.filter
def format_weight_kg(value):
    """
    Rules:
    - < 1 kg → grams (e.g., 0.5 → 500 g)
    - >= 1 kg and whole number → number only (e.g., 2.0 → 2)
    - >= 1 kg and decimal → show with kg (e.g., 1.5 → 1.5 kg)
    """
    if value is None or value == "":
        return ""

    # Convert to Decimal safely
    try:
        kg = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        # If it's not a number, just return as-is (or empty)
        return str(value)

    if kg <= 0:
        return ""

    # < 1 kg => grams
    if kg < 1:
        grams = (kg * 1000).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        return f"{grams}g"

    # >= 1 kg
    # Whole number => show without unit, without decimals
    if kg == kg.to_integral_value():
        return f"{str(int(kg))}kg"

    # Decimal => show kg, trim trailing zeros nicely
    # Example: 1.50 -> 1.5
    normalized = kg.normalize()
    # normalize() may produce scientific notation for large/small; avoid that:
    text = format(normalized, "f").rstrip("0").rstrip(".")
    return f"{text}kg"
