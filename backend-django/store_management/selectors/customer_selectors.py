from django.db.models import Max
from orders.models.orders_models import Order
from accounts.models import User, UserProfile
from orders.selectors.analytics_selectors import _unified_phone_annotation

def search_customers_by_phone(query, storage_location=None, limit=10):
    """
    Search for customers matching the given phone number prefix.
    First checks registered User accounts globally. If more suggestions
    are needed, it checks the Orders table for the specific storage location.
    """
    # Clean query to digits only
    query = ''.join(filter(str.isdigit, query))
    if len(query) < 3:
        return []

    results = []
    seen_phones = set()

    # 1. Search globally in registered User profiles
    users = User.objects.filter(phone_number__icontains=query).select_related('profile')[:limit]
    for user in users:
        raw_phone = str(user.phone_number).replace("+", "").replace(" ", "")
        phone = raw_phone[-10:] if len(raw_phone) >= 10 else raw_phone
        
        name = ""
        if hasattr(user, 'profile') and user.profile:
            name = user.profile.get_full_name().strip()
            
        results.append({
            "phone": phone,
            "name": name
        })
        seen_phones.add(phone)

    # 2. Search locally in Order history if limit isn't reached
    if len(results) < limit:
        qs = Order.objects.annotate(
            unified_phone=_unified_phone_annotation()
        ).filter(unified_phone__startswith=query)

        if storage_location:
            qs = qs.filter(storage_location=storage_location)

        rows = (
            qs.values("unified_phone")
            .annotate(
                any_user_id=Max("user_id"),
                recent_customer_name=Max("customer_name")
            )
            .order_by("unified_phone")[:limit]
        )

        missing_uids = [r["any_user_id"] for r in rows if r["any_user_id"] and r["unified_phone"] not in seen_phones]
        profiles = {}
        if missing_uids:
            profiles = {
                p.user_id: p.get_full_name()
                for p in UserProfile.objects.filter(user_id__in=missing_uids).only("user_id", "first_name", "last_name")
            }

        for row in rows:
            phone = row["unified_phone"]
            if not phone or phone in seen_phones:
                continue
                
            uid = row["any_user_id"]
            name = profiles.get(uid) or row["recent_customer_name"] or ""
            
            results.append({
                "phone": phone,
                "name": name.strip()
            })
            seen_phones.add(phone)
            
            if len(results) >= limit:
                break

    return results
