import React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function OperationalEfficiencyChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="sd-table-card p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-medium mb-1">Operational Efficiency</h5>
          <div className="small text-muted">
            Avg Packing Time vs Delivery Time (mins)
          </div>
        </div>
        <div className="d-flex gap-3 small">
          <span className="d-flex align-items-center gap-1">
            <span className="badge rounded-pill bg-primary p-1"></span> Packing
          </span>
          <span className="d-flex align-items-center gap-1">
            <span className="badge rounded-pill bg-warning p-1"></span> Delivery
          </span>
        </div>
      </div>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              label={{
                value: "Minutes",
                angle: -90,
                position: "insideLeft",
                fill: "#cbd5e1",
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)",
              }}
              cursor={{ fill: "#f8fafc" }}
            />
            <Bar
              dataKey="packing_min"
              barSize={20}
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Packing Time"
            />
            <Line
              type="monotone"
              dataKey="delivery_min"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 0, fill: "#f59e0b" }}
              name="Delivery Time"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
