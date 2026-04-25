from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.auth import get_user_model
from .zone_models import DeliveryZone
from inventory.models.delivery_slot_models import DeliveryTimeSlot
from django.utils import timezone
from orders.models.orders_models import Order

User = get_user_model()


class DeliveryPartnerProfile(models.Model):
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]
    BLOOD_GROUP_CHOICES = [
        ("A+", "A+"), ("A-", "A-"), ("B+", "B+"), ("B-", "B-"),
        ("O+", "O+"), ("O-", "O-"), ("AB+", "AB+"), ("AB-", "AB-"),
    ]
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Inactive", "Inactive"),
        ("On Leave", "On Leave"),
    ]
    VEHICLE_TYPES = [
        ("Bike", "Bike"),
        ("Scooter", "Scooter"),
        ("Bicycle", "Bicycle"),
    ]

    user        = models.OneToOneField(User, on_delete=models.PROTECT, related_name="delivery_partner_profile")
    zone        = models.ForeignKey(DeliveryZone, on_delete=models.SET_NULL, null=True, blank=True, related_name="delivery_partners")

    employee_id     = models.CharField(max_length=50, unique=True, null=True, blank=True)
    first_name      = models.CharField(max_length=100)
    last_name       = models.CharField(max_length=100)
    dob             = models.DateField(null=True, blank=True)
    gender          = models.CharField(max_length=10, choices=GENDER_CHOICES, default="Male")
    blood_group     = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, default="O+")
    profile_image   = models.ImageField(upload_to="delivery/profiles/", blank=True, null=True)

    emergency_contact   = PhoneNumberField(blank=True, null=True)
    address             = models.TextField(blank=True)

    vehicle_type                = models.CharField(max_length=20, choices=VEHICLE_TYPES, default="Bike")
    vehicle_number              = models.CharField(max_length=50, blank=True)
    license_number              = models.CharField(max_length=50, blank=True)
    vehicle_insurance_expiry    = models.DateField(null=True, blank=True)

    joining_date    = models.DateField(null=True, blank=True)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")
    is_active_duty  = models.BooleanField(default=False)

    bank_account_number = models.CharField(max_length=50, blank=True)
    ifsc_code           = models.CharField(max_length=20, blank=True)
    bank_name           = models.CharField(max_length=100, blank=True)
    upi_id              = models.CharField(max_length=100, blank=True, null=True)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.vehicle_type}"


class DeliveryWallet(models.Model):
    delivery_man        = models.OneToOneField(DeliveryPartnerProfile, on_delete=models.CASCADE, related_name='wallet')
    total_earned        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_withdrawn     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    current_balance     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    today_earned        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    today_deliveries    = models.PositiveIntegerField(default=0)
    last_reset_date     = models.DateField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet — {self.delivery_man} | ₹{self.current_balance}"

    def credit(self, amount, order=None, note=''):
        self.total_earned       += amount
        self.current_balance    += amount
        self.today_earned       += amount
        self.today_deliveries   += 1
        self.save(update_fields=['total_earned', 'current_balance', 'today_earned', 'today_deliveries', 'updated_at'])
        WalletTransaction.objects.create(wallet=self, order=order,transaction_type='credit', amount=amount, note=note)

    def debit(self, amount, note=''):
        if amount > self.current_balance:
            raise ValueError("Insufficient balance")
        self.total_withdrawn    += amount
        self.current_balance    -= amount
        self.save(update_fields=['total_withdrawn', 'current_balance', 'updated_at'])
        WalletTransaction.objects.create(wallet=self, transaction_type='debit', amount=amount, note=note)

    def reset_today(self):
        self.today_earned       = 0
        self.today_deliveries   = 0
        self.last_reset_date    = timezone.now().date()
        self.save(update_fields=['today_earned', 'today_deliveries', 'last_reset_date'])


class WalletTransaction(models.Model):
    TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('debit',  'Debit'),
        ('bonus',  'Bonus'),
    ]
    wallet              = models.ForeignKey(DeliveryWallet, on_delete=models.CASCADE, related_name='transactions')
    order               = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL)
    transaction_type    = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount              = models.DecimalField(max_digits=10, decimal_places=2)
    note                = models.TextField(blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type.upper()} ₹{self.amount} | {self.wallet.delivery_man}"


class WithdrawalRequest(models.Model):
    PAYMENT_MODE_CHOICES = [
        ('upi',           'UPI'),
        ('bank_transfer', 'Bank Transfer (NEFT/IMPS)'),
    ]
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    wallet              = models.ForeignKey(DeliveryWallet, on_delete=models.CASCADE, related_name='withdrawals')
    amount              = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode        = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES, default='upi')
    bank_account_number = models.CharField(max_length=18, blank=True,null=True)
    upi_id              = models.CharField(max_length=50, blank=True,null=True)
    bank_ifsc           = models.CharField(max_length=11, blank=True,null=True)
    bank_name           = models.CharField(max_length=50, blank=True,null=True)
    account_holder_name = models.CharField(max_length=100, blank=True,null=True)
    status              = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    requested_at        = models.DateTimeField(auto_now_add=True)
    resolved_at         = models.DateTimeField(null=True, blank=True)
    admin_note          = models.TextField(blank=True)

    def __str__(self):
        return f"₹{self.amount} via {self.payment_mode} — {self.wallet.delivery_man} [{self.status}]"


# ─────────────────────────────────────────────
# Batch = envelope for a group of orders
# assigned to one delivery partner for one slot
# ─────────────────────────────────────────────

class DeliveryAssignmentBatch(models.Model):
    STATUS_CHOICES = [
        ('pending',      'Pending'),        # created by admin, partner not yet acted
        ('accepted',     'Accepted'),       # partner accepted at least one order
        ('in_progress',  'In Progress'),    # at least one order picked up
        ('completed',    'Completed'),      # all orders delivered or failed
        ('cancelled',    'Cancelled'),      # all orders rejected by partner
    ]

    batch_number    = models.CharField(max_length=20, unique=True, editable=False)
    delivery_man    = models.ForeignKey(DeliveryPartnerProfile, on_delete=models.SET_NULL, null=True, related_name="batches")
    delivery_slot   = models.ForeignKey(DeliveryTimeSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name="batches")
    slot_label      = models.CharField(max_length=50, blank=True)   # snapshot e.g. "2 PM – 4 PM"
    delivery_date   = models.DateField(null=True, blank=True)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_earnings  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_by      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_at     = models.DateTimeField(auto_now_add=True)
    accepted_at     = models.DateTimeField(null=True, blank=True)
    completed_at    = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.batch_number} → {self.delivery_man} [{self.status}]"

    def save(self, *args, **kwargs):
        if not self.batch_number:
            last = DeliveryAssignmentBatch.objects.order_by("-id").first()
            next_id = (last.id + 1) if last else 1
            self.batch_number = f"BT-{next_id:04d}"
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────
# BatchItem = one order inside a batch
# ─────────────────────────────────────────────

class DeliveryBatchItems(models.Model):

    batch           = models.ForeignKey(DeliveryAssignmentBatch, on_delete=models.CASCADE, related_name="assignments")
    order           = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="batch_items")
    attempt_number  = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"Batch {self.batch.batch_number} | Order {self.order.order_number}"


# ─────────────────────────────────────────────
# OTP — tied to a batch item (one order)
# ─────────────────────────────────────────────
class DeliveryOTP(models.Model):
    batch_item  = models.ForeignKey(DeliveryBatchItems, on_delete=models.CASCADE, related_name="otps",null=True, blank=True)
    otp         = models.CharField(max_length=6)
    created_at  = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"OTP for {self.batch_item} — verified: {self.is_verified}"


# ─────────────────────────────────────────────
# Log — append only, tied to a batch item
# ─────────────────────────────────────────────

class DeliveryLog(models.Model):
    EVENT_CHOICES = [
        ('assigned',     'Order Assigned'),
        ('accepted',     'Order Accepted'),
        ('rejected',     'Order Rejected'),
        ('picked_up',    'Picked Up'),
        ('otp_sent',     'OTP Sent'),
        ('otp_verified', 'OTP Verified'),
        ('otp_failed',   'OTP Failed'),
        ('delivered',    'Delivered'),
        ('failed',       'Delivery Failed'),
        ('reassigned',   'Reassigned to Another'),
    ]

    batch_item  = models.ForeignKey(DeliveryBatchItems, on_delete=models.CASCADE, related_name='logs',null=True, blank=True)
    event       = models.CharField(max_length=20, choices=EVENT_CHOICES)
    note        = models.TextField(blank=True)
    timestamp   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.batch_item} — {self.event} at {self.timestamp}"