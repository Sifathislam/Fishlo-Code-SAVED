import requests
from django.conf import settings
from django.utils import timezone
from delivery.utils.slot_format import slot_label
from datetime import timedelta
from inventory.models.delivery_slot_models import DeliveryTimeSlot


def get_next_available_slot(storage_location, now_dt=None):
    """
    Returns:
      (day_word, slot_obj) like ("Today", slot) / ("Tomorrow", slot)
      or (None, None) if no slot found.
    """
    if not now_dt:
        now_dt = timezone.localtime()

    today = now_dt.date()
    now_time = now_dt.time()

    open_t = storage_location.opening_time
    close_t = storage_location.closing_time

    def _valid_slots(day_key, only_future_today=False):
        qs = (
            DeliveryTimeSlot.objects
            .filter(storagelocation=storage_location, delivery_day=day_key, is_active=True, is_full=False)
            .order_by("start_time")
        )

        for s in qs:
            # keep slot inside store open/close
            if open_t and s.start_time < open_t:
                continue
            if close_t and s.end_time > close_t:
                continue

            # TODAY rules
            if only_future_today:
                # already ended
                if s.start_time <= now_time:
                    continue

                cutoff_minutes = int(getattr(s, "cutoff_minutes", 0) or 0)
                if cutoff_minutes > 0:
                    cutoff_dt = now_dt + timedelta(minutes=cutoff_minutes)
                    # if slot end soon, booking closed
                    if s.start_time <= cutoff_dt.time():
                        continue

            return s  # first valid = nearest upcoming

        return None

    # try TODAY first
    slot_today = _valid_slots("TODAY", only_future_today=True)
    if slot_today:
        return "Today", slot_today

    # else try TOMORROW
    slot_tomorrow = _valid_slots("TOMORROW", only_future_today=False)
    if slot_tomorrow:
        return "Tomorrow", slot_tomorrow

    return None, None



def get_delivery_time_response(user_location, storage_location):
    """
    Returns:
      - if closed or if you prefer slot-based always:
          {"estimated_delivery_time": "9AM - 10AM", "message": "Today 9AM - 10AM"}
    """
    if not storage_location:
        return {"estimated_delivery_time": None, "message": "Storage location not found."}

    now_dt = timezone.localtime()

    # Find next available slot (today first, else tomorrow)
    day_word, slot = get_next_available_slot(storage_location, now_dt=now_dt)
    next_slot_str = slot_label(slot.start_time, slot.end_time)

    return {
        "estimated_delivery_time": next_slot_str,
        "message": f"{day_word} {next_slot_str}",
    }


