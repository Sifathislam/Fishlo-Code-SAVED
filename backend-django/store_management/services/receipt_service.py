# store_management/services/receipt_service.py

from decimal import Decimal
from datetime import datetime
import textwrap
from django.utils import timezone
from orders.utils.number_data_formater import format_amount, format_weight
# 58mm printers usually 32 chars; 80mm usually 40–48
RECEIPT_WIDTH = 32


def _s(val) -> str:
    return "" if val is None else str(val)


def wrap_lines(text: str, width: int):
    text = _s(text).strip()
    if not text:
        return [""]
    return textwrap.wrap(text, width=width) or [""]


def line(width: int) -> str:
    return "-" * width


def money(x) -> str:
    try:
        return f"{Decimal(str(x)):.2f}"
    except Exception:
        return "0.00"

def add_center(lines: list, text: str, width: int):
    text = _s(text)
    for ln in wrap_lines(text, width):
        lines.append(ln.center(width))

def _get_cuts_text(item) -> str:
    """
    Returns comma separated cuts name.
    Works even if selected_cuts not prefetched.
    If no selected_cuts, falls back to custom_note for custom items.
    """
    names = []
    try:
        if hasattr(item, "selected_cuts") and item.selected_cuts is not None:
            # Use .all() if manager, else might be a list
            if hasattr(item.selected_cuts, "all"):
                cuts_qs = item.selected_cuts.all()
            else:
                cuts_qs = item.selected_cuts
            names = [c.name for c in cuts_qs if getattr(c, "name", None)]
    except Exception:
        pass
        
    if names:
        return ", ".join(names)
    
    # Fallback to custom_note if it's a custom item or no cuts selected
    note = getattr(item, "custom_note", "")
    return note if note else ""

def _add_item_cuts_lines(lines: list, *, item, width: int, amt_w: int = 7, show_price: bool = False):
    cuts_text = _get_cuts_text(item)
    if not cuts_text:
        return

    prefix = "  Cuts: "
    wrap_w = max(8, width - len(prefix) - (amt_w if show_price else 0))
    wrapped = wrap_lines(cuts_text, wrap_w)

    cut_price = getattr(item, "cut_price", None)

    # first line
    line_txt = prefix + wrapped[0]

    if show_price and cut_price is not None:
        try:
            if Decimal(str(cut_price)) > 0:
                    amount_str = format_amount(cut_price)
                    price_txt = f"₹{amount_str}".rjust(amt_w)

                    space = width - len(line_txt) - len(price_txt)
                    line_txt = line_txt + (" " * max(space, 1)) + price_txt
        except Exception:
            pass

    lines.append(line_txt)

    # remaining wrapped lines
    for extra in wrapped[1:]:
        lines.append(" " * len(prefix) + extra)


def build_manual_order_receipt(*, order, company=None,storage=None,width: int = 32) -> str:
    """
    Customer receipt (beautiful aligned for 58mm / 32 chars)
    Columns for width=32:
      NAME=14, WT=5, QTY=3, AMT=7
      Total: 14 + 1 + 5 + 1 + 3 + 1 + 7 = 32
    """

    # ---- COLUMN SETUP ----
    name_w = 14
    wt_w = 5
    qty_w = 3
    amt_w = width - (name_w + 1 + wt_w + 1 + qty_w + 1)  # should be 7 for width=32

    lines = []

    # ---- HEADER ----
    company_name = getattr(company, "name", "FISHLO")
    address1 = getattr(storage, "location", "") 
    phone = getattr(company, "phone", "")
    email = getattr(company, "email", "")

    add_center(lines, "Sales Invoice", width)
    add_center(lines, company_name, width)
    if address1:
        add_center(lines, address1, width)
    if phone:
        add_center(lines, f"Phone: {phone}", width)
    if email:
        add_center(lines, f"Email: {email}", width)

    lines.append(line(width))

    # ---- ORDER INFO ----
    created_at = getattr(order, "created_at", None) or getattr(order, "created", None)
    if created_at:
        dt = timezone.localtime(created_at)
        date_str = dt.strftime("%d-%m-%Y")
        time_str = dt.strftime("%H:%M:%S")
    else:
        now = datetime.now()
        date_str = now.strftime("%d-%m-%Y")
        time_str = now.strftime("%H:%M:%S")

    customer_name = getattr(order, "customer_name", "") or "Walk-In Customer"
    customer_phone = getattr(order, "customer_phone", "") or None
    bill_no = getattr(order, "order_number", "") or getattr(order, "id", "")
    token_no = getattr(order, "token_number", None)

    # (Optional but nice) Token on customer receipt too
    if token_no:
        lines.append(f"Token: {str(token_no).zfill(4)}")
    lines.append(f"Name : {customer_name}")
    if customer_phone:
        lines.append(f"Phone : {customer_phone}")
    lines.append(f"Date : {date_str}")
    lines.append(f"Time : {time_str}")
    lines.append(f"Bill : {bill_no}")
    lines.append(line(width))

    # ---- ITEMS HEADER ----
    # Use short headers so alignment stays perfect
    lines.append(
        f"{'PRODUCT'.ljust(name_w)} "
        f"{'WEIGHT'.rjust(wt_w)} "
        f"{'QTY'.rjust(qty_w)} "
        f"{'AMOUNT'.rjust(amt_w)}"
    )
    lines.append(line(width))

    # ---- ITEMS ----
    items = getattr(order, "order_items", None)
    if hasattr(items, "all"):
        items = items.all()
    else:
        items = []
    for item in items:
        pname = _s(getattr(item, "product_name", "") or getattr(item, "name", "Item"))
        qty = int(getattr(item, "quantity", 1) or 1)
        product = getattr(item,"product")
        
        if not product and getattr(item, "is_custom", False):
            class DummyProduct:
                sell_type = getattr(item, "sell_type", "WEIGHT")
            product = DummyProduct()

        cut_price = getattr(item,"cut_price", 0)
        
        # product_weight on OrderItem is your snapshot weight per unit option
        # If you want total weight of this line: product_weight * qty
        unit_w = getattr(item, "product_weight", None)
        unit_w_dec = Decimal(str(unit_w or 0))

        is_custom = getattr(item, "is_custom", False)
        if is_custom:
            cut_price_total = Decimal(str(cut_price or 0))
            line_weight = unit_w_dec
        else:
            cut_price_total = Decimal(str(cut_price or 0))
            line_weight = unit_w_dec

        # ---- FIXED AMOUNT LOGIC ----
        subtotal = Decimal(str(getattr(item, "subtotal", 0)))
        amt = subtotal - cut_price_total

        wt_txt = format_weight(line_weight,product,qty)
        amt_txt = f"₹{(format_amount(amt))}"
        
        wrapped_name = wrap_lines(pname, name_w)

        # first line shows all columns
        lines.append(
            f"{wrapped_name[0].ljust(name_w)} "
            f"{wt_txt.rjust(wt_w)} "
            f"{str(qty).rjust(qty_w)} "
            f"{amt_txt.rjust(amt_w)}"
        )
        # remaining name lines only
        for extra in wrapped_name[1:]:
            lines.append(f"{extra.ljust(name_w)} {' '.rjust(wt_w)} {' '.rjust(qty_w)} {' '.rjust(amt_w)}")
            
        # _add_item_cuts_lines(lines, item=item, width=width, show_price=True)
        _add_item_cuts_lines(lines, item=item, width=width, amt_w=amt_w, show_price=True)

    lines.append(line(width))

    # ---- TOTALS ----
    subtotal = getattr(order, "subtotal", 0)
    discount = getattr(order, "discount_amount", 0)
    adjustable_amount = getattr(order, "adjustable_amount", 0)
    total = getattr(order, "total_amount", 0)

    def right_total(label: str, value) -> str:
        # keep last 10 chars for value
        val = str(format_amount(value)).rjust(10)
        return f"{label.ljust(width - 10)}{val}"

    lines.append(right_total("Sub-Total:", f"₹{subtotal}"))
    if adjustable_amount:
        lines.append(right_total("Rounding Off:", f"₹{adjustable_amount}"))
    if discount:
        lines.append(right_total("Discount:", f"₹{discount}"))
    lines.append(line(width))
    lines.append(right_total("NET PAYABLE:", f"₹{total}"))

    lines.append("")
    for ln in wrap_lines("Order online at www.fishlo.in and get 20% discount + free delivery.", width):
        lines.append(ln.ljust(width))
    lines.append("")
    add_center(lines, "Thank You", width)
    add_center(lines, "Visit Again", width)

    return "\n".join([str(x) for x in lines])


def build_staff_kitchen_ticket(*, order, width: int = 32) -> str:
    """
    Staff/Kitchen ticket:
    - NO shop header
    - Token, Date, Time, Bill
    - Items: name + weight + qty (NO amount)
    """

    # ---- COLUMN SETUP ----
    name_w = 20
    wt_w = 5
    qty_w = width - (name_w + 1 + wt_w + 1)  # remaining for qty

    lines = []

    created_at = getattr(order, "created_at", None)
    if created_at:
        dt = timezone.localtime(created_at)
        date_str = dt.strftime("%d-%m-%Y")
        time_str = dt.strftime("%H:%M:%S")
    else:
        now = datetime.now()
        date_str = now.strftime("%d-%m-%Y")
        time_str = now.strftime("%H:%M:%S")

    token = getattr(order, "token_number", None)
    token_txt = str(token).zfill(4) if token else "----"
    bill_no = getattr(order, "order_number", "") or getattr(order, "id", "")

    lines.append(f"TOKEN: {token_txt}")
    lines.append(f"Date : {date_str}")
    lines.append(f"Time : {time_str}")
    lines.append(f"Bill : {bill_no}")
    lines.append(line(width))

    lines.append(f"{'ITEM'.ljust(name_w)} {'WEIGHT'.rjust(wt_w)} {'QTY'.rjust(qty_w)}")
    lines.append(line(width))

    items = getattr(order, "order_items", None)
    if hasattr(items, "all"):
        items = items.all()
    else:
        items = []

    for item in items:
        pname = _s(getattr(item, "product_name", "") or getattr(item, "name", "Item"))
        qty = int(getattr(item, "quantity", 1) or 1)
        product = getattr(item,"product")

        if not product and getattr(item, "is_custom", False):
            class DummyProduct:
                sell_type = getattr(item, "sell_type", "WEIGHT")
            product = DummyProduct()

        unit_w = getattr(item, "product_weight", None)
        unit_w_dec = Decimal(str(unit_w or 0))
        
        is_custom = getattr(item, "is_custom", False)
        if is_custom:
            line_weight = unit_w_dec
        else:
            line_weight = unit_w_dec

        wt_txt = format_weight(line_weight,product,qty)

        wrapped_name = wrap_lines(pname, name_w)

        lines.append(
            f"{wrapped_name[0].ljust(name_w)} {wt_txt.rjust(wt_w)} {str(qty).rjust(qty_w)}"
        )
        for extra in wrapped_name[1:]:
            lines.append(f"{extra.ljust(name_w)} {' '.rjust(wt_w)} {' '.rjust(qty_w)}")
        _add_item_cuts_lines(lines, item=item, width=width, show_price=False)

    lines.append(line(width))
    lines.append("")

    return "\n".join([str(x) for x in lines])



def _get_customer_snapshot(order):
    """
    Prefer OrderAddress snapshot.
    Fallback to order.customer_name/phone.
    """
    addr = getattr(order, "order_address", None)

    # name/phone/email
    name = ""
    phone = ""
    email = ""

    if addr:
        name = getattr(addr, "full_name", "") or ""
        phone = getattr(addr, "phone", "") or ""
        email = getattr(addr, "email", "") or ""

    name = name or getattr(order, "customer_name", "") or "Customer"
    phone = phone or getattr(order, "customer_phone", "") or ""

    # address string (snapshot)
    address_lines = []
    if addr:
        full_addr = ""
        try:
            full_addr = addr.get_full_address()
        except Exception:
            # fallback manual build
            parts = [
                getattr(addr, "house_details", ""),
                getattr(addr, "address_line_2", ""),
                getattr(addr, "city", ""),
                getattr(addr, "state", ""),
                getattr(addr, "country", ""),
                getattr(addr, "postal_code", ""),
            ]
            full_addr = ", ".join([p for p in parts if p])
        if full_addr:
            address_lines = wrap_lines(full_addr, 32)

    return name, phone, email, address_lines


def build_online_order_receipt(*, order, company=None,storage=None, width: int = 32) -> str:
    """
    Single receipt for ONLINE orders, includes customer contact + delivery address.

    Columns (width=32):
      NAME=14, WT=5, QTY=3, AMT=7
    """
    name_w = 14
    wt_w = 5
    qty_w = 3
    amt_w = width - (name_w + 1 + wt_w + 1 + qty_w + 1)  # = 7

    lines = []

    # ---- HEADER ----
    company_name = getattr(company, "name", "FISHLO")
    address1 = getattr(storage, "location", "")     
    phone = getattr(company, "phone", "")
    email = getattr(company, "email", "")

    add_center(lines, "Sales Invoice", width)
    add_center(lines, company_name, width)
    if address1:
        add_center(lines, address1, width)
    if phone:
        add_center(lines, f"Phone: {phone}", width)
    if email:
        add_center(lines, f"Email: {email}", width)

    lines.append(line(width))

    # ---- ORDER INFO ----
    created_at = getattr(order, "created_at", None) or getattr(order, "created", None)
    if created_at:
        dt = timezone.localtime(created_at)
        date_str = dt.strftime("%d-%m-%Y")
        time_str = dt.strftime("%H:%M:%S")
    else:
        now = datetime.now()
        date_str = now.strftime("%d-%m-%Y")
        time_str = now.strftime("%H:%M:%S")

    bill_no = getattr(order, "order_number", "") or getattr(order, "id", "")
    token_no = getattr(order, "token_number", None)

    if token_no:
        lines.append(f"Token: {str(token_no).zfill(4)}")

    lines.append(f"Bill : {bill_no}")
    lines.append(f"Date : {date_str}")
    lines.append(f"Time : {time_str}")

    pay_method = getattr(order, "payment_method", "") or ""
    pay_status = getattr(order, "payment_status", "") or ""
    if pay_method:
        lines.append(f"Pay  : {pay_method}")
    if pay_status:
        lines.append(f"Status: {pay_status}")

    lines.append(line(width))

    # ---- CUSTOMER INFO + ADDRESS ----
    cname, cphone, cemail, address_lines = _get_customer_snapshot(order)

    lines.append(f"Name : {cname}")
    if cphone:
        lines.append(f"Phone: {cphone}")
    if cemail:
        # email might be long
        for ln in wrap_lines(f"Email: {cemail}", width):
            lines.append(ln)

    if address_lines:
        lines.append("Addr :")
        for ln in address_lines:
            lines.append(ln)

    lines.append(line(width))

    # ---- ITEMS HEADER ----
    lines.append(
        f"{'PRODUCT'.ljust(name_w)} "
        f"{'WEIGHT'.rjust(wt_w)} "
        f"{'QTY'.rjust(qty_w)} "
        f"{'AMOUNT'.rjust(amt_w)}"
    )
    lines.append(line(width))

    # ---- ITEMS ----
    items = getattr(order, "order_items", None)
    items = items.all() if hasattr(items, "all") else []

    for item in items:
        pname = _s(getattr(item, "product_name", "") or getattr(item, "name", "Item"))
        qty = int(getattr(item, "quantity", 1) or 1)
        product = getattr(item, "product", None)

        if not product and getattr(item, "is_custom", False):
            class DummyProduct:
                sell_type = getattr(item, "sell_type", "WEIGHT")
            product = DummyProduct()

        # show unit weight (or total weight if you prefer)
        unit_w = getattr(item, "product_weight", None)
        unit_w_dec = Decimal(str(unit_w or 0))
        
        is_custom = getattr(item, "is_custom", False)
        cut_price = getattr(item, "cut_price", 0)
        if is_custom:
            cut_price_total = Decimal(str(cut_price or 0))
            line_weight = unit_w_dec
        else:
            cut_price_total = Decimal(str(cut_price or 0)) * Decimal(str(qty))
            line_weight = unit_w_dec

        subtotal = Decimal(str(getattr(item, "subtotal", 0) or 0))
        amt = subtotal - cut_price_total
        amt_txt = str(format_amount(amt or 0))

        wt_txt = format_weight(line_weight, product, qty)

        wrapped_name = wrap_lines(pname, name_w)

        lines.append(
            f"{wrapped_name[0].ljust(name_w)} "
            f"{wt_txt.rjust(wt_w)} "
            f"{str(qty).rjust(qty_w)} "
            f"{amt_txt.rjust(amt_w)}"
        )
        for extra in wrapped_name[1:]:
            lines.append(
                f"{extra.ljust(name_w)} "
                f"{' '.rjust(wt_w)} "
                f"{' '.rjust(qty_w)} "
                f"{' '.rjust(amt_w)}"
            )

        _add_item_cuts_lines(lines, item=item, width=width, amt_w=amt_w, show_price=True)

    lines.append(line(width))

    # ---- TOTALS ----
    subtotal = getattr(order, "subtotal", 0)
    delivery = getattr(order, "delivery_charge", 0)
    discount = getattr(order, "discount_amount", 0)
    partial_pay = getattr(order,"partial_pay",0)
    remaining_amount = getattr(order,"remaining_amount",0)
    adjustable_amount = getattr(order, "adjustable_amount", 0)
    total = getattr(order, "total_amount", 0)

    def right_total(label: str, value) -> str:
        val = str(format_amount(value)).rjust(10)
        return f"{label.ljust(width - 10)}{val}"
    lines.append(right_total("Sub-Total:", subtotal))
    if delivery and Decimal(str(delivery)) > 0:
        lines.append(right_total("Delivery:", delivery))
    if adjustable_amount and Decimal(str(adjustable_amount)) != 0:
        lines.append(right_total("Rounding Off:", - adjustable_amount))
    if discount and Decimal(str(discount)) > 0:
        lines.append(right_total("Discount:", - discount))
    cash_collected = getattr(order, "cash_collected", 0)
    
    if partial_pay and Decimal(str(partial_pay)) > 0:
        lines.append(line(width))
        lines.append(right_total("Amount Before Payment:", total))
        lines.append(right_total("Paid Online:", -partial_pay))
        if cash_collected and Decimal(str(cash_collected)) > 0:
            lines.append(right_total("Cash Paid:", -cash_collected))
        lines.append(line(width))
        lines.append(right_total("NET PAYABLE:", remaining_amount))
    elif cash_collected and Decimal(str(cash_collected)) > 0:
        lines.append(line(width))
        lines.append(right_total("Total Amount:", total))
        lines.append(right_total("Cash Paid:", -cash_collected))
        lines.append(line(width))
        lines.append(right_total("NET PAYABLE:", remaining_amount))
    else:
        lines.append(line(width))
        lines.append(right_total("NET PAYABLE:", total))

    # delivery slot snapshot (optional nice-to-have)
    delivery_label = getattr(order, "delivery_slot_label", "") or ""
    est_date = getattr(order, "estimated_delivery_date", None)
    if delivery_label or est_date:
        lines.append("")
        if est_date:
            lines.append(f"Delivery Date: {est_date}")
        if delivery_label:
            lines.append(f"Slot: {delivery_label}")

    lines.append("")
    add_center(lines, "Thank You", width)
    add_center(lines, "Visit Again", width)

    return "\n".join([str(x) for x in lines])