from datetime import date, timedelta
from orders.selectors.analytics_selectors import (
    get_summary_stats,
    get_sales_chart_data,
    get_sales_by_category,
    get_top_products,
    get_top_customers,
    get_customer_insights,
    get_repeat_customers_table,
    get_new_customers_table,
)
def parse_date_range(period: str, start_str: str | None, end_str: str | None):
    """
    Returns (start_date, end_date).
    Custom range takes priority over period shortcut.
    """
    today = date.today()
    start_date = None
    end_date = None

    if start_str:
        try:
            start_date = date.fromisoformat(start_str)
        except ValueError:
            pass

    if end_str:
        try:
            end_date = date.fromisoformat(end_str)
        except ValueError:
            pass

    # If we have at least one custom date, fill the other with defaults
    if start_date or end_date:
        if not end_date:
            end_date = start_date
        if not start_date:
            start_date = end_date
            
        if start_date > end_date:
            start_date, end_date = end_date, start_date
            
        return start_date, end_date

    days_map = {"1": 1, "7": 7, "14": 14, "30": 30, "90": 90}
    days = days_map.get(period, 14)
    return today - timedelta(days=days - 1), today


def get_analytics_summary(request,start_date, end_date):
    return get_summary_stats(request,start_date, end_date)

def get_analytics_charts(request, start_date, end_date):
    return {
        "sales_chart": get_sales_chart_data(request, start_date, end_date),
        "sales_by_category": get_sales_by_category(request, start_date, end_date),
    }


def get_analytics_tables(request, start_date, end_date, top_n=5):
    return {
        "top_products": get_top_products(request,start_date, end_date, limit=top_n),
        "top_customers": get_top_customers(request, start_date, end_date, limit=top_n),
    }

def get_analytics_customer_insights(request, start_date, end_date):
    insights = get_customer_insights(request, start_date, end_date)
    
    repeat_table = get_repeat_customers_table(insights, limit=50)
    new_table = get_new_customers_table(insights, limit=50)
    
    # Remove internal qs and sets to avoid JSON serialization errors
    safe_insights = {
        "total_unique_customers": insights["total_unique_customers"],
        "new_customers": insights["new_customers"],
        "returning_customers": insights["returning_customers"],
        "repeat_rate_pct": insights["repeat_rate_pct"],
        "new_change_pct": insights["new_change_pct"],
        "returning_change_pct": insights["returning_change_pct"],
        "total_change_pct": insights["total_change_pct"],
    }
    
    return {
        "insights": safe_insights,
        "repeat_customers": repeat_table,
        "new_customers": new_table,
    }