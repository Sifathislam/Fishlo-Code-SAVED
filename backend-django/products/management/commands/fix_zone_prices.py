from decimal import Decimal
import random
from django.core.management.base import BaseCommand
from django.db import transaction

from products.models import Product, PriceMatrix
from inventory.models import StorageLocation


def _d(n: int) -> Decimal:
    # store as Decimal with .00
    return Decimal(str(int(n)))


@transaction.atomic
def set_prices_for_zone(zone_id: int, min_amount=100, max_amount=700, seed=None, dry_run=False):
    """
    Sets/creates active PriceMatrix for every Product for a specific zone (StorageLocation),
    using full integer amounts between min_amount and max_amount.
    Guarantees: min <= bargain <= display <= regular and all within [min_amount, max_amount].
    """
    if seed is not None:
        random.seed(seed)

    zone = StorageLocation.objects.get(id=zone_id)

    product_ids = (
        Product.objects
        .filter(inventory__storagelocation=zone)
        .values_list("id", flat=True)
        .distinct()
    )

    products = Product.objects.filter(id__in=product_ids)  # or add .select_for_update()


    updated = 0
    created = 0

    for product in products:
        # pick a regular price (full amount) in range
        regular = random.randint(min_amount, max_amount)

        # define a simple consistent ladder under it (also full amounts)
        display = max(min_amount, regular - random.randint(0, 40))
        bargain = max(min_amount, display - random.randint(0, 40))
        min_price = max(min_amount, bargain - random.randint(0, 40))

        # keep within max bound too
        regular = min(regular, max_amount)
        display = min(display, regular)
        bargain = min(bargain, display)
        min_price = min(min_price, bargain)

        # optional: wholesale (not checked by your DB constraints, but keep sensible)
        wholesale = max(min_amount, min_price - random.randint(0, 30))
        wholesale = min(wholesale, min_price)

        # ensure there is only one active for (product, zone)
        pm = PriceMatrix.objects.filter(product=product, storage_location=zone, is_active=True).first()

        if dry_run:
            continue

        if pm:
            pm.wholesale_price = _d(wholesale)
            pm.regular_price = _d(regular)
            pm.display_price = _d(display)
            pm.bargain_price = _d(bargain)
            pm.min_price = _d(min_price)
            pm.save()
            updated += 1
        else:
            PriceMatrix.objects.create(
                product=product,
                storage_location=zone,
                is_active=True,
                wholesale_price=_d(wholesale),
                regular_price=_d(regular),
                display_price=_d(display),
                bargain_price=_d(bargain),
                min_price=_d(min_price),
            )
            created += 1

    return {"zone": zone.name, "updated": updated, "created": created, "total_products": products.count()}


class Command(BaseCommand):
    help = "Create/update active PriceMatrix for all products in a specific zone with full prices 100-700."

    def add_arguments(self, parser):
        parser.add_argument("zone_id", type=int, help="StorageLocation (zone) id")
        parser.add_argument("--min", dest="min_amount", type=int, default=100)
        parser.add_argument("--max", dest="max_amount", type=int, default=700)
        parser.add_argument("--seed", dest="seed", type=int, default=None)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        res = set_prices_for_zone(
            zone_id=options["zone_id"],
            min_amount=options["min_amount"],
            max_amount=options["max_amount"],
            seed=options["seed"],
            dry_run=options["dry_run"],
        )
        self.stdout.write(self.style.SUCCESS(
            f"Zone: {res['zone']} | products: {res['total_products']} | updated: {res['updated']} | created: {res['created']}"
        ))
