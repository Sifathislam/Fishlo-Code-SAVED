import React from "react";
import { TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Package, Wallet, BarChart3 } from "lucide-react";

const Card = ({ title, value, change, icon: Icon, colorClass, valueColorClass, overridePositive, prefix = "₹" }) => {
  // overridePositive: if passed, use it to decide arrow/color instead of the change sign
  const isPositive = overridePositive !== undefined ? overridePositive : (change >= 0);
  const valueTextClass = valueColorClass || "text-dark";
  // Hide vs-prev if change is null, undefined, or unreliably large (e.g. prev was 0)
  const showChange = change !== null && change !== undefined && Math.abs(change) <= 999;
  
  return (
    <div className="col">
      <div className={`card h-100 shadow-sm border-0 border-start border-4 border-${colorClass}`}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted small fw-medium text-uppercase ls-1">{title}</span>
            <div className={`p-2 bg-${colorClass}-subtle rounded-circle text-${colorClass}`}>
              <Icon size={18} />
            </div>
          </div>
          <h3 className={`fw-bold mb-1 ${valueTextClass}`}>
            {prefix}{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h3>
          {showChange ? (
            <div className={`d-flex align-items-center gap-1 small fw-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(change).toFixed(1)}%</span>
              <span className="text-muted fw-normal ms-1">vs prev.</span>
            </div>
          ) : (
            <div className="small text-muted">No prev. data</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PnLSummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-5 g-3 mb-4">
      <Card 
        title="Revenue" 
        value={summary.revenue} 
        change={summary.revenue_change_pct} 
        icon={IndianRupee} 
        colorClass="primary" 
      />
      <Card 
        title="COGS (Fish)" 
        value={summary.fish_cogs ?? summary.cogs ?? 0} 
        change={summary.fish_cogs_change_pct ?? summary.cogs_change_pct} 
        icon={ShoppingBag} 
        colorClass="danger" 
      />
      <Card 
        title="COGS (Masala)" 
        value={summary.masala_cogs ?? 0} 
        change={summary.masala_cogs_change_pct ?? null} 
        icon={Package} 
        colorClass="warning" 
      />
      <Card 
        title="Expenses" 
        value={(summary.total_variable ?? 0) + (summary.total_operational ?? 0)} 
        change={summary.variable_change_pct} 
        icon={Wallet} 
        colorClass="info" 
      />
      <Card 
        title="Net Profit" 
        value={summary.net_profit} 
        change={summary.net_profit_change_pct} 
        icon={BarChart3} 
        colorClass={summary.net_profit >= 0 ? "success" : "danger"} 
        valueColorClass={summary.net_profit >= 0 ? "text-success" : "text-danger"}
        overridePositive={summary.net_profit >= 0}
      />
    </div>
  );
}
