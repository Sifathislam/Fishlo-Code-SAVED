import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#0d6efd", "#0dcaf0", "#6610f2", "#6f42c1", "#d63384", "#fd7e14", "#ffc107", "#198754", "#20c997"];

export default function ExpenseBreakdownChart({ summary }) {
  const chartData = useMemo(() => {
    if (!summary) return [];
    
    const combined = {
      ...summary.variable_breakdown,
      ...summary.operational_breakdown,
      "Fish Cost (COGS)": summary.cogs
    };

    return Object.entries(combined)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value: value
      }))
      .sort((a, b) => b.value - a.value);
  }, [summary]);

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white border-bottom p-3">
        <h6 className="fw-bold mb-0">Total Cost Breakdown</h6>
      </div>
      <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center">
        {chartData.length > 0 ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₹${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  layout="horizontal"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-muted small py-5">No expense data available</div>
        )}
      </div>
    </div>
  );
}
