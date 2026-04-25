import React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function RetentionChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="sd-table-card p-4 h-100">
      <h5 className="fw-medium mb-4">Customer Retention Rate</h5>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="gradRet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8" }}
              unit="%"
            />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
            <Area
              type="monotone"
              dataKey="retention_pct"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#gradRet)"
              name="Retention %"
            />
            <Line
              type="monotone"
              dataKey="new_pct"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="New Acquisition %"
              dot={false}
            />
            <Legend iconType="circle" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
