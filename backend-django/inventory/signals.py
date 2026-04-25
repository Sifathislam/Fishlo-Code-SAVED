# inventory/signals.py
from __future__ import annotations

from datetime import datetime, date, timedelta
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from inventory.models.storage_models import StorageLocation
from inventory.models.delivery_slot_models import DeliveryTimeSlot


def _iter_slots(opening_time, closing_time, step_minutes: int):
    base_day = date(2000, 1, 1)
    start_dt = datetime.combine(base_day, opening_time)
    close_dt = datetime.combine(base_day, closing_time)

    step = timedelta(minutes=step_minutes)
    cur = start_dt

    while cur + step <= close_dt:
        yield cur.time(), (cur + step).time()
        cur += step


@transaction.atomic
def sync_delivery_slots_for_location(location_id: int) -> None:
    loc = StorageLocation.objects.select_for_update().get(id=location_id)

    if not loc.opening_time or not loc.closing_time:
        return
    if loc.opening_time >= loc.closing_time:
        return

    step = int(loc.slot_step_minutes or 0)
    if step <= 0:
        return

    desired_pairs = list(_iter_slots(loc.opening_time, loc.closing_time, step))
    desired_set = set(desired_pairs)

    day_rules = {
        "TODAY": {
            "is_active": bool(loc.today_slots_enabled),
            "is_full": bool(loc.today_slots_full),
        },
        "TOMORROW": {
            "is_active": bool(loc.tomorrow_slots_enabled),
            "is_full": bool(loc.tomorrow_slots_full),
        },
    }

    for day_key, rules in day_rules.items():
        qs = DeliveryTimeSlot.objects.select_for_update().filter(
            storagelocation=loc,
            delivery_day=day_key,
        )

        # 1) Bulk update ALL existing slots (cutoff + day flags)
        qs.update(
            cutoff_minutes=int(loc.cutoff_minutes or 0),
            is_active=rules["is_active"],
            is_full=rules["is_full"],
        )

        # 2) Create missing slots (exact pair check)
        existing_pairs = set(qs.values_list("start_time", "end_time"))
        missing_pairs = desired_set - existing_pairs

        if missing_pairs:
            DeliveryTimeSlot.objects.bulk_create(
                [
                    DeliveryTimeSlot(
                        storagelocation=loc,
                        delivery_day=day_key,
                        start_time=start_t,
                        end_time=end_t,
                        cutoff_minutes=int(loc.cutoff_minutes or 0),
                        is_active=rules["is_active"],
                        is_full=rules["is_full"],
                    )
                    for (start_t, end_t) in missing_pairs
                ],
                ignore_conflicts=True,
            )

        # 3) Delete obsolete slots (PAIR-SAFE)
        existing = list(
            DeliveryTimeSlot.objects.filter(
                storagelocation=loc,
                delivery_day=day_key,
            ).values_list("id", "start_time", "end_time")
        )

        obsolete_ids = [
            slot_id
            for (slot_id, start_t, end_t) in existing
            if (start_t, end_t) not in desired_set
        ]

        if obsolete_ids:
            DeliveryTimeSlot.objects.filter(id__in=obsolete_ids).delete()


@receiver(post_save, sender=StorageLocation)
def create_or_update_delivery_slots(sender, instance: StorageLocation, **kwargs):
    transaction.on_commit(lambda: sync_delivery_slots_for_location(instance.id))