from orders.selectors.bi_selectors import (
    get_bi_summary,
    get_operational_efficiency,
    get_store_volume_heatmap,
    get_customer_retention,
    get_rider_performance,
)
from orders.services.analytics_services import parse_date_range


def get_bi_summary_service(request, period, start_str, end_str):
    start, end = parse_date_range(period, start_str, end_str)
    return get_bi_summary(request, start, end)


def get_bi_charts_service(request, period, start_str, end_str):
    start, end = parse_date_range(period, start_str, end_str)
    return {
        "operational_efficiency": get_operational_efficiency(request, start, end),
        "heatmap":                get_store_volume_heatmap(request, start, end),
    }


def get_bi_customers_service(request, period, start_str, end_str):
    start, end = parse_date_range(period, start_str, end_str)
    return get_customer_retention(request, start, end)


def get_bi_riders_service(request, period, start_str, end_str):
    start, end = parse_date_range(period, start_str, end_str)
    return get_rider_performance(request, start, end)