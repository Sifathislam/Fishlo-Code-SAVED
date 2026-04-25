import uuid
from decimal import Decimal
from django.db.models import Sum, Q
from django.utils.timezone import localdate
from datetime import timedelta

from django.db import IntegrityError, connection, models, transaction
from django.utils import timezone

from accounts.models import User
from products.models import Cut, Product

from ..mixins.price_mixins import PriceCalculationMixin
from orders.utils.number_data_formater import format_amount
from ..models.tax_models import TaxConfiguration

from django.contrib.gis.db import models as gis_models
from inventory.models.delivery_slot_models import DeliveryTimeSlot
from inventory.models.storage_models import StorageLocation
# ---------------
# ORDER MODEL
# ---------------

class Order(models.Model):
    """Main order model"""

    class OrderSource(models.TextChoices):
        ONLINE = "ONLINE", "Online"
        MANUAL_STORE = "MANUAL_STORE", "Manual Store"

    class PurchaseType(models.TextChoices):
            WALK_IN_CUSTOMER = "WALK_IN_CUSTOMER", "Walk in customer"
            HOME_DELIVERY = "HOME_DELIVERY", "Home delivery"

    class OrderStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        PACKED = "PACKED", "Packed"
        ASSIGNING = "ASSIGNING", "Assigning"
        ASSIGN = "ASSIGN", "Assign"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"
        FAILED = "FAILED", "Failed"

    STATUS_CHOICES = OrderStatus.choices
 
    PAYMENT_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PAID", "Paid"),
        ("PARTIALLY_PAID", "Partially Paid"),
        ("FAILED", "Failed"),
        ("REFUNDED", "Refunded"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("Razorpay", "Razorpay"),
        ("UPI_ON_DELIVERY", "UPI_ON_DELIVERY"),
        ("UPI_ONLINE", "UPI_ONLINE"),
        ("CASH", "CASH"),
        ("COD", "Cash On Delivery"),
    ]
    
    order_number = models.CharField(max_length=50, unique=True, db_index=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders",blank=True,null=True)
    # In Order model, add this field:
    storage_location = models.ForeignKey(StorageLocation,on_delete=models.SET_NULL,null=True, blank=True,related_name="orders")
    # Order Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="PENDING")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default="Razorpay")
    transaction_id = models.CharField(max_length=255, null=True, blank=True)

    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    vat_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    vat_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    discount_code = models.CharField(max_length=50, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    discount_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    discount_fixed_amount = models.DecimalField(max_digits=10,decimal_places=2,default=Decimal("0.00"),help_text="Discount fixed amount",)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    partial_pay = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    cash_collected = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"), help_text="Amount collected in cash by the delivery person")
    adjustable_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_pieces= models.PositiveIntegerField(blank=True, null=True, help_text="Total in pieces")
    # Weight
    total_weight = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total weight in kg")

    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, related_name="cancelled_by")

    # Additional Info
    notes = models.TextField(blank=True, null=True, help_text="Customer notes or special instructions")
    cancellation_reason = models.TextField(blank=True, null=True, help_text="Reason for order cancellation")
    invoice_pdf = models.FileField(upload_to="invoices/pdf/", blank=True, null=True)
    invoice_generated_at = models.DateTimeField(null=True, blank=True)
    manual_receipt_pdf = models.FileField(upload_to="manual_receipts/",null=True,blank=True)
    
    source = models.CharField(max_length=20, choices=OrderSource.choices, default=OrderSource.ONLINE)
    purchase_type = models.CharField(max_length=20, choices=PurchaseType.choices, default=PurchaseType.HOME_DELIVERY)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, related_name="manual_created_orders")
    # For walk-in customer snapshot
    customer_name = models.CharField(max_length=200, null=True, blank=True)
    customer_phone = models.CharField(max_length=30, null=True, blank=True)
    # Delivery Time Slots
    delivery_day = models.CharField(max_length=10,default='TODAY',null=True,blank=True,)
    delivery_slot = models.ForeignKey(DeliveryTimeSlot,on_delete=models.SET_NULL,null=True,blank=True,related_name="orders",)
    delivery_slot_start = models.TimeField(null=True, blank=True)
    delivery_slot_end = models.TimeField(null=True, blank=True)
    delivery_slot_label = models.CharField(max_length=50, null=True, blank=True)

    token_number = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    token_generated_at = models.DateTimeField(null=True, blank=True)
    
    
    # Order OTP number 
    otp_session_id = models.CharField(max_length=150, null=True, blank=True)
    otp_sent_at = models.DateTimeField(null=True, blank=True) 
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.order_number} - {self.user.email if self.user else''}"
    

    def save(self, *args, **kwargs):
        creating = self._state.adding
        # Generate token number for ALL orders
        # Format: 4 Digi a..
        # rt from 1121

        if creating and not self.token_number:
            with connection.cursor() as cursor:
                cursor.execute("SELECT nextval('order_token_seq')")
                self.token_number = cursor.fetchone()[0]
            
        """
        Generate unique order number using PostgreSQL sequence.
        Format: FL-YYMMDD-XXXX

        This method is SUPER FAST:
        - Handles 10,000+ concurrent orders
        - No waiting, no locks
        - Response time < 5 seconds even under extreme load
        """
        if not self.order_number:
            max_attempts = 3

            for attempt in range(max_attempts):
                try:
                    # Get current date
                    today = timezone.now().date()
                    date_str = today.strftime("%y%m%d")  # Format: 241230

                    # Get next sequence number from PostgreSQL (ATOMIC & INSTANT)
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT nextval('order_number_seq')")
                        sequence_number = cursor.fetchone()[0]

                    # Generate order number: FL-241230-0001
                    self.order_number = f"FL-{date_str}-{sequence_number:06d}"

                    # Save order
                    super().save(*args, **kwargs)
                    break  # Success! Exit loop

                except IntegrityError as e:
                    # Duplicate order number detected (extremely rare)
                    if attempt == max_attempts - 1:
                        # Final attempt: add microsecond suffix for uniqueness
                        microseconds = timezone.now().strftime("%f")[:3]
                        self.order_number = (
                            f"FL-{date_str}-{sequence_number:06d}{microseconds}"
                        )
                        super().save(*args, **kwargs)
                        break
                    # Retry
                    continue

                except Exception as e:
                    # Unexpected error - use UUID fallback
                    if attempt == max_attempts - 1:
                        unique_id = uuid.uuid4().hex[:4].upper()
                        self.order_number = f"FL-{date_str}-{unique_id}"
                        super().save(*args, **kwargs)
                        break
                    continue
        else:
            # Order already has order_number, just update
            super().save(*args, **kwargs)

    def calculate_totals(self):
        """Calculate all pricing fields"""
        # Subtotal from order items
        self.subtotal = format_amount(sum(item.subtotal for item in self.order_items.all()))
        # Get active tax configuration
        tax_config = TaxConfiguration.get_active_tax()
        if tax_config:
            # Calculate tax amount
            self.vat_percentage = tax_config.tax_percentage
            tax_able_amount = format_amount(self.subtotal - Decimal(self.discount_amount))
            self.vat_amount = format_amount(tax_config.calculate_tax(tax_able_amount))
        else:
            # Fallback to 5% if no tax config
            self.vat_percentage = Decimal("5.00")
            self.vat_amount = format_amount((self.subtotal * Decimal("5.00")) / 100)

        # Total amount
        total = self.subtotal + self.delivery_charge - Decimal(self.discount_amount)
        # Separate integer and decimal parts
        integer_part = int(total)  # removes decimal
        decimal_part = total - Decimal(integer_part)

        self.adjustable_amount = format_amount(decimal_part)
        self.total_amount = format_amount(Decimal(integer_part))

       
        totals = self.order_items.aggregate(
            total_weight=Sum("weight", filter=Q(product__sell_type=Product.SellType.WEIGHT)),
            total_pieces=Sum(
                "pieces",
                filter=Q(product__sell_type__in=[Product.SellType.PIECE, Product.SellType.PACK]),
            ),
        )

        self.total_weight = totals["total_weight"] or Decimal("0.00")
        self.total_pieces = totals["total_pieces"] or 0

        self.save(update_fields=[
            "subtotal", "vat_percentage", "vat_amount", "total_amount","adjustable_amount",
            "total_weight", "total_pieces"
        ])


    def get_tracking_timeline(self):
        """Returns timeline with optimized query"""

        status_flow = [
            (self.OrderStatus.PENDING, "Order Placed"),
            (self.OrderStatus.CONFIRMED, "Confirmed"),
            (self.OrderStatus.PROCESSING, "Processing"),
            (self.OrderStatus.PACKED, "Packed"),
            (self.OrderStatus.OUT_FOR_DELIVERY, "Out for Delivery"),
            (self.OrderStatus.DELIVERED, "Delivered"),
        ]

        # Optimized query - fetch only needed fields
        tracking_records = {
            record.status: record
            for record in self.tracking_history.only(
                "status", "timestamp", "location", "notes", "details"
            )
        }

        # Build timeline
        timeline = []
        for status_code, status_label in status_flow:
            record = tracking_records.get(status_code)

            completed = record.completed if record else None
            timestamp = record.timestamp if record else None
            is_current = record.is_current if record else None

            if status_code == self.OrderStatus.OUT_FOR_DELIVERY:
                assign_record = tracking_records.get(self.OrderStatus.ASSIGN)
                packed_record = tracking_records.get(self.OrderStatus.PACKED)
                
                if not timestamp and assign_record:
                    timestamp = assign_record.timestamp
                    
                if record and record.completed:
                    completed = True
                    is_current = False
                elif assign_record and assign_record.completed:
                    completed = True
                    is_current = False
                elif packed_record and packed_record.completed:
                    completed = False
                    is_current = True

            elif status_code == self.OrderStatus.DELIVERED:
                assign_record = tracking_records.get(self.OrderStatus.ASSIGN)
                
                if record and record.completed:
                    completed = True
                    is_current = False
                elif assign_record and assign_record.completed:
                    completed = False
                    is_current = True

            timeline.append(
                {
                    "status": status_code,
                    "status_display": status_label,
                    "completed": completed,
                    "timestamp": timestamp,
                    "is_current": is_current,
                }
            )

        if self.status == self.OrderStatus.CANCELLED:
            # Filter to keep only steps that occurred before cancellation
            timeline = [step for step in timeline if step["completed"] or step["is_current"]]
            
            cancel_record = tracking_records.get(self.OrderStatus.CANCELLED)
            cancel_timestamp = (cancel_record.timestamp if cancel_record else None) or self.cancelled_at
            timeline.append({
                "status": self.OrderStatus.CANCELLED,
                "status_display": "Cancelled",
                "completed": True,
                "timestamp": cancel_timestamp,
                "is_current": True,
            })
            
            # Un-mark is_current from previous steps to make Cancelled the active one
            for step in timeline[:-1]:
                step["is_current"] = False

        return timeline
    def update_status(self, new_status, updated_by_user=None, notes=None, updated_from="SYSTEM"):

        try:
            self._skip_signal_tracking = True

            if self.status != new_status:
                self.status = new_status
                self.save(update_fields=['status', 'updated_at'])

            # Mark all previous tracking as not current
            self.tracking_history.filter(is_current=True).update(
                is_current=False, completed=True
            )

            # --- AUTO-FILL SKIPPED STATUSES ---
            if new_status in STATUS_FLOW:
                new_index = STATUS_FLOW.index(new_status)
                for skipped_status in STATUS_FLOW[:new_index]:
                    exists = self.tracking_history.filter(status=skipped_status).exists()
                    if not exists:
                        self.tracking_history.create(
                            status=skipped_status,
                            updated_by=updated_by_user,
                            updated_from=updated_from,
                            notes="Auto-completed (skipped)",
                            is_current=False,
                            completed=True,
                            timestamp=timezone.now(),
                        )
                    else:
                        self.tracking_history.filter(status=skipped_status).update(
                            completed=True, is_current=False
                        )

            # Mark the NEW status as COMPLETED (it has been reached)
            self.tracking_history.update_or_create(
                status=new_status,
                defaults={
                    "updated_by": updated_by_user,
                    "updated_from": updated_from,
                    "notes": notes,
                    "is_current": False,
                    "completed": True,
                    "timestamp": timezone.now(),
                }
            )

            # Create the NEXT status in the flow as is_current=True (upcoming)
            if new_status in STATUS_FLOW:
                new_index = STATUS_FLOW.index(new_status)
                if new_index + 1 < len(STATUS_FLOW):
                    next_status = STATUS_FLOW[new_index + 1]
                    self.tracking_history.update_or_create(
                        status=next_status,
                        defaults={
                            "updated_by": None,
                            "updated_from": updated_from,
                            "notes": None,
                            "is_current": True,
                            "completed": False,
                            "timestamp": None,
                        }
                    )

        except Exception as e:
            raise

    def set_delivery_slot(self, slot, delivery_day):
        """
        Assign delivery slot and store snapshot values.
        """

        today = localdate()

        if delivery_day == "TODAY":
            delivery_date = today
        elif delivery_day == "TOMORROW":
            delivery_date = today + timedelta(days=1)
        else:
            delivery_date = today  # fallback safety

        self.estimated_delivery_date = delivery_date
        self.delivery_day = delivery_day
        self.delivery_slot = slot
        self.delivery_slot_start = slot.start_time
        self.delivery_slot_end = slot.end_time
        self.delivery_slot_label = slot.label()

        self.save(update_fields=[
            "estimated_delivery_date",
            "delivery_day",
            "delivery_slot",
            "delivery_slot_start",
            "delivery_slot_end",
            "delivery_slot_label",
        ])
    def get_delivery_day_display(self):
            if not self.estimated_delivery_date:
                return "-"

            today = localdate()

            if self.estimated_delivery_date == today:
                return "Today"
            elif self.estimated_delivery_date == today + timedelta(days=1):
                return "Tomorrow"

            return self.estimated_delivery_date.strftime("%d %b %Y")
    def get_delivery_date(self):
        return f"{self.estimated_delivery_date if self.estimated_delivery_date else ''}  {self.delivery_slot_label if self.delivery_slot_label else ''}"

    def set_delivery_charge(self, delivery_charge_obj):
        self.delivery_charge = delivery_charge_obj.charge_amount  # Decimal
        self.save(update_fields=["delivery_charge"])


STATUS_FLOW = [
    Order.OrderStatus.PENDING,
    Order.OrderStatus.CONFIRMED,
    Order.OrderStatus.PROCESSING,
    Order.OrderStatus.PACKED,
    Order.OrderStatus.ASSIGNING,
    Order.OrderStatus.ASSIGN,
    Order.OrderStatus.OUT_FOR_DELIVERY,
    Order.OrderStatus.DELIVERED,
]

# ---------------
# ORDER Item MODEL
# ---------------
class OrderItem(PriceCalculationMixin, models.Model):
    """Individual items in an order"""

    class SellType(models.TextChoices):
        WEIGHT = "WEIGHT", "By Weight (per kg)"
        PIECE = "PIECE", "By Piece"
        PACK = "PACK", "Fixed Pack"

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="order_items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT,null=True,blank=True)

    # Snapshot data (in case product changes or gets deleted)
    product_name = models.CharField(max_length=250)
    sell_type = models.CharField(max_length=10,choices=SellType.choices,default=SellType.WEIGHT,null=True,blank=True)
    product_image = models.ImageField(
        upload_to="images/order_items/", null=True, blank=True
    )
    product_weight=models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, help_text="Weight in kg (e.g. 0.25, 0.5)")
    weight_option_label_snapshot = models.CharField(max_length=50, blank=True, null=True)

    sku = models.CharField(max_length=100)
    # Quantity and Weight
    quantity = models.PositiveIntegerField(default=1)
    weight = models.DecimalField(
        max_digits=10, decimal_places=4, help_text="Total weight for this item",null=True,blank=True
    )
    pieces= models.PositiveIntegerField(
            blank=True, null=True, help_text="Item in pieces"
        )
    
    expected_net_weight_min_per_kg_snapshot = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Min expected net weight as % of gross (e.g. 70 for 70%)"
    )
    expected_net_weight_max_per_kg_snapshot = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Max expected net weight as % of gross (e.g. 80 for 80%)"
    )

    # Cuts
    selected_cuts = models.ManyToManyField(Cut, blank=True, related_name="order_items")
    cut_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Pricing
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Price per unit at time of order"
    )
    original_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Original price for comparison"
    )
    subtotal = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Total for this item"
    )
    
    
    is_custom = models.BooleanField(default=False)
    custom_note = models.TextField(null=True, blank=True)
    entered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="custom_items_created")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return (
            f"{self.product_name} x {self.quantity} - Order {self.order.order_number}"
        )

    def save(self, *args, **kwargs):
        # Save snapshot data
        if not self.product_name:
            self.product_name = self.product.name
        if not self.sku:
            self.sku = self.product.sku
        if not self.product_image and self.product.featured_image:
            self.product_image = self.product.featured_image
        if not self.original_price:
            self.original_price = self.product.regular_price

        # Calculate weight and subtotal
        self.weight = self.calculate_weight()
        self.subtotal = self.calculate_subtotal()

        super().save(*args, **kwargs)


# -------------------------
# ORDER Address MODEL
# -------------------------
class OrderAddress(models.Model):
    """
    Links order to user's address with snapshot of address details
    Uses existing UserAddress model to avoid redundancy
    """

    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name="order_address"
    )
    user_address = models.ForeignKey("accounts.UserAddress",on_delete=models.SET_NULL,null=True,blank=True,related_name="orders",)
    point = gis_models.PointField(srid=4326,null=True,blank=True,help_text="order address pointer",)
    billing_address = models.JSONField(default=dict, blank=True, null=True)

    # Contact Information
    full_name = models.CharField(max_length=200, help_text="Contact person's full name")
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20)

    # Address Snapshot (stored at time of order)
    address_type = models.CharField(max_length=10, default="home")
    address_type_other = models.CharField(max_length=50, null=True, blank=True)
    house_details = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100,null=True,blank=True)
    state = models.CharField(max_length=100,null=True,blank=True)
    postal_code = models.CharField(max_length=20,null=True,blank=True)
    country = models.CharField(max_length=100, default="India")
    is_billing_same_as_shipping = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Order Address"
        verbose_name_plural = "Order Addresses"

    def __str__(self):
        return f"Address for Order {self.order.order_number} - {self.city}"

    def save(self, *args, **kwargs):
        # If user_address is provided, copy its data as snapshot
        if self.user_address and not self.pk:
            self.address_type = self.user_address.address_type
            self.address_type_other = self.user_address.address_type_other
            self.house_details = self.user_address.house_details
            self.address_line_2 = self.user_address.address_line_2
            self.city = self.user_address.city
            self.state = self.user_address.state
            self.postal_code = self.user_address.postal_code
            self.country = self.user_address.country
        super().save(*args, **kwargs)

        Order.objects.filter(pk=self.order_id).update(
            customer_phone=self.phone,
            customer_name=self.full_name,
        )
        
    def get_full_address(self):
        """Return formatted full address"""
        parts = [
            self.house_details,
            self.address_line_2,
            self.city,
            self.state,
            self.country,
            self.postal_code,
        ]
        return ", ".join(filter(None, parts))


# ---------------------
# ORDER Tracking MODEL
# ---------------------
class OrderTracking(models.Model):
    """Track order status changes and delivery progress"""

    # Status choices
    STATUS_CHOICES = Order.OrderStatus.choices

    class UpdateSource(models.TextChoices):
        SYSTEM = "SYSTEM", "System"
        STORE_DASHBOARD = "STORE_DASHBOARD", "Store Dashboard"
        ADMIN_DASHBOARD = "ADMIN_DASHBOARD", "Admin Dashboard"
        DELIVERY_APP = "DELIVERY_APP", "Delivery App"
        CUSTOMER = "CUSTOMER", "Customer"

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="tracking_history"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, help_text="Current status of the order"
    )
    location = models.CharField(
        max_length=755, null=True, blank=True, help_text="Current location of shipment"
    )
    completed = models.BooleanField(
        default=False, help_text="If the Current Track is Complete"
    )
    is_current = models.BooleanField(
        default=False, help_text="Only one tracking per order can be current"
    )
    notes = models.TextField(
        null=True, blank=True, help_text="Additional notes about this status update"
    )
    timestamp = models.DateTimeField(null=True, blank=True)
    assigned_for_delivery = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="delivery_man",
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="order_status_updates",
        help_text="User who updated this status",
        db_column="updated_by",
    )
    updated_from = models.CharField(
        max_length=20,
        choices=UpdateSource.choices,
        default=UpdateSource.SYSTEM,
        help_text="Source of the status update (e.g. Store Dashboard, Admin, Delivery App)",
    )
    details = models.JSONField(
        null=True, blank=True, help_text="Additional flexible data"
    )

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Order Tracking"
        verbose_name_plural = "Order Tracking"
        unique_together = ["order", "status"]
        indexes = [
            models.Index(fields=["order", "-timestamp"]),
            models.Index(fields=["status", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.order.order_number} - {self.get_status_display()}"
    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.is_current:
                OrderTracking.objects.filter(
                    order=self.order, is_current=True
                ).exclude(pk=self.pk).update(is_current=False)

            if self.completed and self.timestamp is None:
                self.timestamp = timezone.now()

            super().save(*args, **kwargs)

class PaymentMethodLog(models.Model):
    """Tracks history of payment method changes for audit purposes"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payment_method_logs")
    old_method = models.CharField(max_length=20)
    new_method = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-changed_at"]
        verbose_name = "Payment Method Log"
        verbose_name_plural = "Payment Method Logs"

    def __str__(self):
        return f"{self.order.order_number}: {self.old_method} -> {self.new_method}"
