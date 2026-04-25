import datetime
from django.utils import timezone
from store_management.models import StoreManagerProfile
from orders.selectors.profit_selectors import get_profit_summary

class DummyUser:
    pass

class DummyRequest:
    def __init__(self, user):
        self.user = user

def run():
    print("Testing get_profit_summary...")
    
    store_profile = StoreManagerProfile.objects.first()
    user = DummyUser()
    if store_profile:
        user.store_manager_profile = store_profile
        
    request = DummyRequest(user=user)
    
    end_date = timezone.now().date()
    start_date = end_date - datetime.timedelta(days=30)
    
    try:
        summary = get_profit_summary(request, start_date, end_date)
        for k, v in summary.items():
            print(f"{k}: {v}")
        print("Success!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")

run()
