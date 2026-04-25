from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from inventory.models import Inventory, StorageLocation
from products.models import Product


class Command(BaseCommand):
    help = "Create inventory records for products that dont have one and copy prices"

    def add_arguments(self, parser):
        parser.add_argument(
            "--storage-location",
            type=str,
            default="Main Warehouse",
            help="Name of the storage location to use (default: Main Warehouse)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run without making any changes (preview only)",
        )
        parser.add_argument(
            "--update-existing",
            action="store_true",
            help="Update prices in existing inventory records",
        )

    def handle(self, *args, **options):
        storage_name = options["storage_location"]
        dry_run = options["dry_run"]
        update_existing = options["update_existing"]

        if dry_run:
            self.stdout.write(
                self.style.WARNING("🔍 DRY RUN MODE - No changes will be made")
            )

        # Get or create storage location
        try:
            storage_location = StorageLocation.objects.get(name=storage_name)
            self.stdout.write(
                self.style.SUCCESS(f"✓ Using storage location: {storage_location.name}")
            )
        except StorageLocation.DoesNotExist:
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'⚠ Storage location "{storage_name}" does not exist (would create)'
                    )
                )
                storage_location = None
            else:
                storage_location = StorageLocation.objects.create(
                    name=storage_name,
                    location="Default Storage Location",
                    capacity_kg=Decimal("10000.00"),
                    capacity_pieces=Decimal("10000.00"),
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Created storage location: {storage_location.name}"
                    )
                )

        # Process products
        all_products = Product.objects.all()
        total_products = all_products.count()

        self.stdout.write(f"\n📦 Found {total_products} products to process\n")

        products_with_inventory = 0
        products_without_inventory = 0
        inventory_created = 0
        inventory_updated = 0
        errors = 0

        with transaction.atomic():
            for product in all_products:
                try:
                    existing_inventory = Inventory.objects.filter(
                        product=product
                    ).first()

                    if existing_inventory:
                        products_with_inventory += 1

                        if update_existing:
                            if not dry_run:
                                existing_inventory.wholesale_price = (
                                    product.wholesale_price or Decimal("0.00")
                                )
                                existing_inventory.regular_price = (
                                    product.regular_price or Decimal("0.00")
                                )
                                existing_inventory.display_price = (
                                    product.display_price or Decimal("0.00")
                                )
                                existing_inventory.bargain_price = (
                                    product.bargain_price or Decimal("0.00")
                                )
                                existing_inventory.min_price = (
                                    product.min_price or Decimal("0.00")
                                )
                                existing_inventory.save()
                                inventory_updated += 1
                            else:
                                self.stdout.write(f"  Would update: {product.name}")
                                inventory_updated += 1
                    else:
                        products_without_inventory += 1

                        if not dry_run and storage_location:
                            Inventory.objects.create(
                                product=product,
                                storagelocation=storage_location,
                                wholesale_price=product.wholesale_price
                                or Decimal("150.00"),
                                regular_price=product.regular_price
                                or Decimal("200.00"),
                                display_price=product.display_price
                                or Decimal("190.00"),
                                bargain_price=product.bargain_price
                                or Decimal("180.00"),
                                min_price=product.min_price or Decimal("170.00"),
                                stock_kg=Decimal("100.000"),
                                stock_pieces=Decimal("100.00"),
                                pieces_per_kg_min=product.min_pieces,
                                pieces_per_kg_max=product.max_pieces,
                                serves_persons=product.min_serves,
                            )
                            inventory_created += 1
                            self.stdout.write(
                                f"  ✓ Created inventory for: {product.name}"
                            )
                        else:
                            self.stdout.write(
                                f"  Would create inventory for: {product.name}"
                            )
                            inventory_created += 1

                except Exception as e:
                    errors += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f"  ✗ Error processing {product.name}: {str(e)}"
                        )
                    )

            if dry_run:
                raise Exception("Dry run - rolling back transaction")

        # Print summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("📊 SUMMARY:"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"Total products: {total_products}")
        self.stdout.write(
            f"Products with existing inventory: {products_with_inventory}"
        )
        self.stdout.write(f"Products without inventory: {products_without_inventory}")
        self.stdout.write(
            self.style.SUCCESS(f"✓ Inventory records created: {inventory_created}")
        )
        if update_existing:
            self.stdout.write(
                self.style.SUCCESS(f"✓ Inventory records updated: {inventory_updated}")
            )
        if errors > 0:
            self.stdout.write(self.style.ERROR(f"✗ Errors: {errors}"))
        self.stdout.write("=" * 60)

        if dry_run:
            self.stdout.write(self.style.WARNING("\n⚠ DRY RUN - No changes were made"))
            self.stdout.write("Run without --dry-run to apply changes")
        else:
            self.stdout.write(
                self.style.SUCCESS("\n✓ Migration completed successfully!")
            )
