from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from products.models.product_models import Product, WeightOption


class Command(BaseCommand):
    help = "Create default weight options (0.25, 0.50, 1.00 kg) for WEIGHT products only."

    DEFAULT_WEIGHTS = [
        (Decimal("0.25"), 1),
        (Decimal("0.50"), 2),
        (Decimal("1.00"), 3),
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--only-missing",
            action="store_true",
            help="Only create weight options for products that currently have no weight options.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created, but do not write to DB.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        only_missing = options["only_missing"]
        dry_run = options["dry_run"]

        qs = Product.objects.filter(sell_type=Product.SellType.WEIGHT)

        if only_missing:
            qs = qs.filter(weight_options__isnull=True).distinct()

        total_products = qs.count()
        created_count = 0
        existing_count = 0

        self.stdout.write(self.style.NOTICE(f"Found {total_products} WEIGHT products to process."))

        for product in qs.iterator():
            for weight, sort_order in self.DEFAULT_WEIGHTS:
                if dry_run:
                    exists = WeightOption.objects.filter(product=product, weight_kg=weight).exists()
                    if exists:
                        existing_count += 1
                        continue
                    created_count += 1
                    self.stdout.write(f"[DRY RUN] Would create: Product={product.id} ({product.name}) weight={weight}")
                    continue

                obj, created = WeightOption.objects.get_or_create(
                    product=product,
                    weight_kg=weight,
                    defaults={
                        "is_active": True,
                        "sort_order": sort_order,
                    },
                )
                if created:
                    created_count += 1
                else:
                    existing_count += 1
                    # Optional: keep sort_order consistent if already exists
                    if obj.sort_order != sort_order:
                        obj.sort_order = sort_order
                        obj.save(update_fields=["sort_order"])

        if dry_run:
            # rollback in dry-run
            transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS(
            f"Done. Created: {created_count}, Already existed: {existing_count}"
        ))
