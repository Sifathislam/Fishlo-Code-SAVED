# orders/management/commands/export_customers.py
import csv, sys
from django.core.management.base import BaseCommand
from orders.models.orders_models import Order
class Command(BaseCommand):
    help = "Export customer name + phone"

    def handle(self, *args, **options):
        qs = (
            Order.objects
            .select_related("order_address")
            .order_by("-created_at")
        )

        writer = csv.writer(sys.stdout)
        writer.writerow(["customer_name", "customer_phone"])

        for order in qs:
            if order.source == Order.OrderSource.MANUAL_STORE:
                name  = order.customer_name  or ""
                phone = order.customer_phone or ""
            else:
                addr  = getattr(order, "order_address", None)
                name  = addr.full_name if addr else ""
                phone = addr.phone     if addr else ""

            writer.writerow([name, phone])