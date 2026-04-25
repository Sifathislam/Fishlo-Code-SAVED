from django.core.management.base import BaseCommand
from orders.models.orders_models import Order
from inventory.models import StorageLocation


class Command(BaseCommand):
    help = "Backfill storage_location on all orders that are missing it"

    def add_arguments(self, parser):
        parser.add_argument(
            "--store-id",
            type=int,
            help="StorageLocation ID to assign to all orders missing a storage location",
        )

    def handle(self, *args, **kwargs):
        store_id = kwargs.get("store_id")

        stores = StorageLocation.objects.all()
        if not stores.exists():
            self.stdout.write(self.style.ERROR("No storage locations found."))
            return

        # Show available stores always
        self.stdout.write("Available stores:")
        for s in stores:
            self.stdout.write(f"  ID={s.id}  →  {s.name}")

        missing_count = Order.objects.filter(storage_location__isnull=True).count()
        self.stdout.write(f"\nOrders missing storage location: {missing_count}")

        if not missing_count:
            self.stdout.write(self.style.SUCCESS("Nothing to backfill. All orders already have a store."))
            return

        if not store_id:
            if stores.count() == 1:
                # Auto-pick if only one store
                store = stores.first()
                self.stdout.write(f"\nOnly one store found. Auto-selecting: {store.name}")
            else:
                self.stdout.write(self.style.ERROR(
                    "\nMultiple stores found. Please pass --store-id=<ID> to specify which store to assign."
                ))
                return
        else:
            store = StorageLocation.objects.filter(id=store_id).first()
            if not store:
                self.stdout.write(self.style.ERROR(f"No store found with ID={store_id}."))
                return

        updated = Order.objects.filter(storage_location__isnull=True).update(
            storage_location=store
        )
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Assigned '{store.name}' (ID={store.id}) to {updated} orders."
        ))