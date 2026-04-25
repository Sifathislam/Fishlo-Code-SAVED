import React from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '10px 14px', fontSize: 13 }}>
      <p className="fw-semibold mb-2 text-dark">{label}</p>
      {payload.map((entry) => {
        const isProfit = entry.dataKey === 'profit';
        const color = isProfit
          ? (entry.value < 0 ? '#ef4444' : '#10b981')
          : entry.color;
        return (
          <p key={entry.dataKey} style={{ color, margin: '2px 0' }}>
            {entry.name} : ₹{Number(entry.value).toLocaleString()}
          </p>
        );
      })}
    </div>
  );
};

export default function RevenueVsCostChart({ chartData }) {
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white border-bottom p-3">
        <h6 className="fw-bold mb-0">Monthly Trend (Revenue vs Costs vs Profit)</h6>
      </div>
      <div className="card-body p-3">
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6c757d', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6c757d', fontSize: 12 }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#0d6efd"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="total_cost"
                name="Total Cost"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Net Profit"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
