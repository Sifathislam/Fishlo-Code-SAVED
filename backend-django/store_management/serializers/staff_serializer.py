from rest_framework import serializers
from store_management.models import StoreManagerProfile
from store_management.services.services_staff import create_staff, update_staff
from django.contrib.auth import get_user_model

User = get_user_model()


class StaffListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    contact = serializers.SerializerMethodField()
    joined = serializers.DateField(source='joining_date', format='%d-%m-%Y')
    avatar_initials = serializers.SerializerMethodField()

    class Meta:
        model = StoreManagerProfile
        fields = [
            'id', 'avatar_initials', 'name', 'role',
            'contact', 'status', 'joined', 'employee_id'
        ]

    def get_name(self, obj):
        return {
            "full_name": f"{obj.first_name} {obj.last_name}",
            "email": obj.user.email or ""
        }

    def get_contact(self, obj):
        return str(obj.user.phone_number) if obj.user.phone_number else ""

    def get_avatar_initials(self, obj):
        first = obj.first_name[0] if obj.first_name else "?"
        last = obj.last_name[0] if obj.last_name else "?"
        return f"{first}{last}".upper()


class StaffCreateUpdateSerializer(serializers.ModelSerializer):
    # User fields — not on profile model
    email = serializers.EmailField(required=False, allow_null=True)
    password = serializers.CharField(
        write_only=True, required=False,
        style={'input_type': 'password'}
    )
    phone_number = serializers.CharField(write_only=True)  # required — it's USERNAME_FIELD

    class Meta:
        model = StoreManagerProfile
        fields = [
            # Professional
            'first_name', 'last_name', 'role', 'shift_timing',
            # User fields
            'email', 'password', 'phone_number',
            # Personal
            'dob', 'gender', 'blood_group', 'current_address', 'permanent_address',
            # Emergency
            'emergency_contact',
            # Payroll
            'salary', 'bank_name', 'bank_account_number',
            'ifsc_code', 'account_holder_name',
            # Documents
            'document_proof', 'profile_image',
            # Meta
            'status', 'joining_date',
        ]

    def validate_email(self, value):
        if not value:
            return value
        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A staff member with this email already exists."
            )
        return value

    def validate_phone_number(self, value):
        qs = User.objects.filter(phone_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A staff member with this phone number already exists."
            )
        return value

    def validate_salary(self, value):
        if value < 0:
            raise serializers.ValidationError("Salary cannot be negative.")
        return value

    def validate(self, attrs):
        # phone_number required on create only
        if not self.instance and not attrs.get('phone_number'):
            raise serializers.ValidationError(
                {"phone_number": "Phone number is required."}
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        return create_staff(validated_data=validated_data, request=request)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        return update_staff(instance=instance, validated_data=validated_data,request=request)


class StaffDetailSerializer(StaffCreateUpdateSerializer):
    employee_id = serializers.CharField(read_only=True)
    joined = serializers.DateField(
        source='joining_date', format='%d-%m-%Y', read_only=True
    )
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta(StaffCreateUpdateSerializer.Meta):
        fields = StaffCreateUpdateSerializer.Meta.fields + ['employee_id', 'joined']