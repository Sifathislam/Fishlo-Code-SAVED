from datetime import timedelta, date
from decimal import Decimal
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth

from orders.selectors.analytics_selectors import _base_order_qs
from orders.models.orders_models import OrderItem
from store_management.models.monthly_expense_models import MonthlyExpense, ExpenseCategory

def get_pnl_summary(request, start_date, end_date):
    """
    Returns P&L summary: Revenue, COGS, Variable Expenses, Operational Expenses, Net Profit.
    """

    location = None
    if hasattr(request.user, "store_manager_profile"):
        location = request.user.store_manager_profile.storage_location

    def _agg_pnl(start, end):
        qs = _base_order_qs(request, start, end)
        
        # Revenue = Full total amount (including delivery charge)
        revenue_agg = qs.aggregate(total=Sum("total_amount"))
        revenue = revenue_agg["total"] or Decimal("0.00")
        
        # Items for Packaging
        items_qs = OrderItem.objects.filter(order__in=qs, product__isnull=False)
        
        # Manual Monthly Expenses
        expenses_qs = MonthlyExpense.objects.filter(storage_location=location)
        

        
        # 1. Initialize variables
        cogs = Decimal("0.00")
        fish_cogs = Decimal("0.00")
        masala_cogs = Decimal("0.00")
        total_variable = Decimal("0.00")
        total_operational = Decimal("0.00")
        variable_breakdown = {}
        operational_breakdown = {}

        # 2. Variable Expenses (Point-in-time)
        # Variable costs occur on specific dates, so we sum them exactly within the range
        variable_expenses = expenses_qs.filter(
            cost_type="VARIABLE",
            expense_date__gte=start,
            expense_date__lte=end
        )
        for exp in variable_expenses:
            if exp.category == ExpenseCategory.FISH_COST:
                fish_cogs += exp.amount
                cogs += exp.amount
            elif exp.category == ExpenseCategory.MASALA_COST:
                masala_cogs += exp.amount
                cogs += exp.amount
            else:
                total_variable += exp.amount
                variable_breakdown[exp.category] = variable_breakdown.get(exp.category, Decimal("0.00")) + exp.amount

        # 3. Time-Based Monthly Expenses (Operational)
        # Sum operational costs exactly as they are entered in the selected date range.
        operational_expenses = expenses_qs.filter(
            cost_type="OPERATIONAL",
            expense_date__gte=start,
            expense_date__lte=end
        )
        for exp in operational_expenses:
            total_operational += exp.amount
            operational_breakdown[exp.category] = operational_breakdown.get(exp.category, Decimal("0.00")) + exp.amount

        net_profit = revenue - cogs - total_variable - total_operational
        net_margin = (net_profit / revenue * 100) if revenue else Decimal("0.00")
        
        return {
            "revenue": revenue,
            "cogs": cogs,
            "fish_cogs": fish_cogs,
            "masala_cogs": masala_cogs,
            "total_variable": total_variable,
            "total_operational": total_operational,
            "net_profit": net_profit,
            "net_margin": net_margin,
            "variable_breakdown": variable_breakdown,
            "operational_breakdown": operational_breakdown
        }

    # Current period
    curr_data = _agg_pnl(start_date, end_date)
    
    # Previous period for comparison
    delta = (end_date - start_date).days + 1
    prev_start = start_date - timedelta(days=delta)
    prev_end = start_date - timedelta(days=1)
    prev_data = _agg_pnl(prev_start, prev_end)

    def _pct(curr, prev):
        if not prev:
            return None
        return round(float((curr - prev) / prev * 100), 1)

    return {
        "revenue": float(curr_data["revenue"]),
        "cogs": float(curr_data["cogs"]),
        "fish_cogs": float(curr_data["fish_cogs"]),
        "masala_cogs": float(curr_data["masala_cogs"]),
        "total_variable": float(curr_data["total_variable"]),
        "total_operational": float(curr_data["total_operational"]),
        "net_profit": float(curr_data["net_profit"]),
        "net_margin_pct": round(float(curr_data["net_margin"]), 1),
        
        "variable_breakdown": {k: float(v) for k, v in curr_data["variable_breakdown"].items()},
        "operational_breakdown": {k: float(v) for k, v in curr_data["operational_breakdown"].items()},
        
        "revenue_change_pct": _pct(curr_data["revenue"], prev_data["revenue"]),
        "cogs_change_pct": _pct(curr_data["cogs"], prev_data["cogs"]),
        "fish_cogs_change_pct": _pct(curr_data["fish_cogs"], prev_data["fish_cogs"]),
        "masala_cogs_change_pct": _pct(curr_data["masala_cogs"], prev_data["masala_cogs"]),
        "variable_change_pct": _pct(curr_data["total_variable"], prev_data["total_variable"]),
        "operational_change_pct": _pct(curr_data["total_operational"], prev_data["total_operational"]),
        "net_profit_change_pct": _pct(curr_data["net_profit"], prev_data["net_profit"]),
    }

def get_pnl_chart_data(request, start_date, end_date):
    """
    Monthly trend: Revenue vs Total Costs (COGS + Packaging + Variable + Operational)
    """
    location = None
    if hasattr(request.user, "store_manager_profile"):
        location = request.user.store_manager_profile.storage_location

    # Get all months in range
    months = []
    curr = start_date.replace(day=1)
    while curr <= end_date:
        months.append((curr.year, curr.month))
        if curr.month == 12:
            curr = curr.replace(year=curr.year + 1, month=1)
        else:
            curr = curr.replace(month=curr.month + 1)

    chart_data = []
    for year, month in months:
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)
        
        # Filter range intersection
        inter_start = max(start_date, month_start)
        inter_end = min(end_date, month_end)
        
        # Reuse get_pnl_summary logic for this month slice
        # Note: calling this in a loop is not most efficient but range is usually small (12 months max)
        month_pnl = get_pnl_summary(request, inter_start, inter_end)
        
        total_cost = month_pnl["cogs"] + month_pnl["total_variable"] + month_pnl["total_operational"]
        
        chart_data.append({
            "month": month_start.strftime("%b %Y"),
            "revenue": month_pnl["revenue"],
            "total_cost": float(total_cost),
            "profit": month_pnl["net_profit"]
        })

    return chart_data
