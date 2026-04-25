from decimal import Decimal, ROUND_HALF_UP


def format_amount(amount):
    """
    Format amount without changing value or data type.
    - Removes .00 if present (e.g., 10.00 → 10)
    - Rounds to max 2 decimal places if needed (e.g., 10.116 → 10.12)
    """
    # Handle Decimal
    if isinstance(amount, Decimal):
        # Round to 2 decimal places
        rounded = amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        # Remove .00 if integer value
        if rounded == rounded.to_integral():
            return rounded.to_integral()
        return rounded
    
    # Handle int (no change needed)
    if isinstance(amount, int):
        return amount
    
    # Handle float
    if isinstance(amount, float):
        # Round to 2 decimal places
        rounded = round(amount, 2)
        # Remove .00 if integer value
        if rounded.is_integer():
            return int(rounded)
        return rounded
    
    # Return unchanged for other types
    return amount



def format_weight(weight,product,qty):
    """
    Convert weight into a human-readable format.

    Rules:
    - < 1 kg → grams (e.g., 0.5 → 500 g)
    - >= 1 kg and whole number → number only (e.g., 2.0 → 2)
    - >= 1 kg and decimal → show with kg (e.g., 1.5 → 1.5 kg)
    """
    
    if product and product.sell_type =="WEIGHT":
        if weight is None:
            return ""

        weight = Decimal(weight)

        # Under 1 kg → grams
        if weight < 1:
            grams = int(weight * 1000)
            return f"{grams}g"

        # Whole number kg → number only
        if weight == weight.to_integral_value():
            return f"{int(weight)}kg"

        # Decimal kg → show kg
        return f"{round(weight.normalize(),2)}kg"
    else:
        
        return f"{qty}pcs"
        
