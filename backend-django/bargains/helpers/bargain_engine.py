from decimal import Decimal

def decide_counter_offer(*, price_obj, state, offered_price):
    display_price = Decimal(price_obj.display_price)
    bargain_price = Decimal(price_obj.bargain_price)
    min_price = Decimal(price_obj.min_price)

    result = {
        "type": None,
        "price": None,
    }

    # 🔹 CASE 1: Numeric offer
    if offered_price is not None:
        offered_price = Decimal(offered_price)

        if offered_price >= display_price:
            result["type"] = "MATCHED_DISPLAY"
            result["price"] = display_price

        elif offered_price >= bargain_price:
            result["type"] = "ACCEPT"
            result["price"] = offered_price

        elif offered_price >= min_price:
            result["type"] = "COUNTER_TO_BARGAIN"
            result["price"] = bargain_price

        else:
            result["type"] = "REJECT_FLOOR"
            result["price"] = min_price

        return result

    # 🔹 CASE 2: No numeric offer (pressure like "last kithna")
    state.repeat_offer_count += 1

    if state.repeat_offer_count <= 1:
        result["type"] = "SOFT_COUNTER"
        result["price"] = bargain_price

    elif state.repeat_offer_count == 2:
        result["type"] = "MID_COUNTER"
        result["price"] = (bargain_price + min_price) / 2

    else:
        result["type"] = "FINAL_FLOOR"
        result["price"] = min_price

    return result



def build_quick_replies(decision, price_obj):
    price = int(decision["price"])

    if decision["type"] in ["ACCEPT", "MATCHED_DISPLAY"]:
        return [
            {"label": f"Ok ₹{price} final", "value": f"Ok ₹{price} final"},
            {"label": "Add 500g?", "value": "If I add 500g can you reduce?"}
        ]

    if decision["type"] in ["SOFT_COUNTER", "MID_COUNTER"]:
        return [
            {"label": "₹10 less", "value": "₹10 less"},
            {"label": "Last price?", "value": "Last kithna?"},
            {"label": f"Ok ₹{price}", "value": f"Ok ₹{price} final"}
        ]

    if decision["type"] == "FINAL_FLOOR":
        return [
            {"label": f"Ok ₹{price}", "value": f"Ok ₹{price} final"},
            {"label": "Add more quantity?", "value": "If I buy more can you reduce?"}
        ]

    return []