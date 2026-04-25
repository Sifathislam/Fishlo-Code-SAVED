# run cmd 
# 
# python manage.py create_delivery_slots --location_id 1

from datetime import time, timedelta, datetime

from django.core.management.base import BaseCommand
from django.db import transaction

from inventory.models import StorageLocation
from inventory.models.delivery_slot_models import DeliveryTimeSlot


class Command(BaseCommand):
    help = "Create delivery time slots for a storage location"

    def add_arguments(self, parser):
        parser.add_argument(
            "--location_id",
            type=int,
            required=True,
            help="Storage Location ID",
        )
        parser.add_argument(
            "--start",
            type=str,
            default="09:00",
            help="Start time in HH:MM (default: 09:00)",
        )
        parser.add_argument(
            "--end",
            type=str,
            default="23:00",
            help="End time in HH:MM (default: 23:00)",
        )
        parser.add_argument(
            "--interval",
            type=int,
            default=60,
            help="Slot interval in minutes (default: 60)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        location_id = options["location_id"]
        start_str = options["start"]
        end_str = options["end"]
        interval = options["interval"]

        try:
            location = StorageLocation.objects.get(id=location_id)
        except StorageLocation.DoesNotExist:
            self.stdout.write(self.style.ERROR("Storage location not found"))
            return

        start_dt = datetime.strptime(start_str, "%H:%M")
        end_dt = datetime.strptime(end_str, "%H:%M")

        created_count = 0
        current = start_dt

        while current < end_dt:
            slot_start = current.time()
            next_time = current + timedelta(minutes=interval)

            if next_time > end_dt:
                break

            slot_end = next_time.time()

            created = DeliveryTimeSlot.objects.create(
                storagelocation=location,
                delivery_day='TOMORROW',
                start_time=slot_start,
                end_time=slot_end,
                is_active=True
            )

            if created:
                created_count += 1

            current = next_time

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {created_count} time slots for {location.name}"
            )
        )
