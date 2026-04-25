from datetime import timedelta
from django.utils import timezone

from inventory.models.delivery_slot_models import DeliveryTimeSlot  
from products.utils import get_user_storage_location  

def _fmt_12h(t):
    # If minutes = 0 → show only hour
    if t.minute == 0:
        return t.strftime("%I%p").lstrip("0")
    # otherwise show hour + minutes
    return t.strftime("%I:%M%p").lstrip("0")

def _slot_label(slot) -> str:
    return f"{_fmt_12h(slot.start_time)} - {_fmt_12h(slot.end_time)}"


def _build_slots(storage_location, target_date, now_dt,delivery_day):
    """
    Returns ALL slots (active + inactive).
    Inactive slots will be disabled with reason "Not available".
    Applies:
      - opening/closing time
      - TODAY: passed/too late disabling
    """
    qs = (
        DeliveryTimeSlot.objects.filter(storagelocation=storage_location,delivery_day=delivery_day)
        .order_by("start_time")
    )
    
    open_t = storage_location.opening_time
    close_t = storage_location.closing_time
    is_today = (target_date == now_dt.date())

    slots = []
    for s in qs:
        # keep slot inside store open/close
        if open_t and s.start_time < open_t:
            continue
        if close_t and s.end_time > close_t:
            continue

        active = True
        reason = None
        if active:
            if is_today and s.start_time <= now_dt.time():
                active = False
                reason = "Passed"
                continue
            else:
                if not s.is_active:
                    active = False
                    reason = "Not available"
                if s.is_full:
                    active = False
                    reason = "Full"
                    
                cutoff_minutes = int(getattr(s, "cutoff_minutes", 0) or 0)
                if is_today and cutoff_minutes > 0:
                    cutoff_dt = now_dt + timedelta(minutes=cutoff_minutes)
                    if s.start_time <= cutoff_dt.time():
                        active = False
                        reason = "Closed"
                        continue

        slots.append(
            {
                "id": s.id,
                "label": _slot_label(s),
                "is_active": active,
                'reason':reason
            }
        )

    return slots


def get_delivery_slots_payload(request):
    """
    Returns today + tomorrow slots for the resolved storage location.
    Uses your existing get_user_storage_location(request) (guest + auth).
    """
    storage_location = get_user_storage_location(request)
    if not storage_location:
        return False, "Storage location not found for this user/session.", None, 400

    now_dt = timezone.localtime()
    today = now_dt.date()
    tomorrow = today + timedelta(days=1)

    payload = {
        "storage_location": {
            "id": storage_location.id,
            "name": storage_location.name,
            "opening_time": storage_location.opening_time.strftime("%H:%M:%S")
            if storage_location.opening_time
            else None,
            "closing_time": storage_location.closing_time.strftime("%H:%M:%S")
            if storage_location.closing_time
            else None,
        },
        "today": {
            "key": "TODAY",
            "date": str(today),
            "slots": _build_slots(storage_location, today, now_dt,'TODAY'),
        },
        "tomorrow": {
            "key": "TOMORROW",
            "date": str(tomorrow),
            "slots": _build_slots(storage_location, tomorrow, now_dt,'TOMORROW'),
        },
    }

    return True, "Delivery slots fetched successfully", payload, 200
