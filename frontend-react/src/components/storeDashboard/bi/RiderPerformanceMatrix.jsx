import React from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const CustomRiderTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-3 shadow-sm border border-light">
        <div className="fw-bold text-dark mb-1">{data.name}</div>
        <div className="small text-muted mb-1">
          Efficiency: <span className="fw-medium text-primary">{data.efficiency_score}%</span>
        </div>
        <div className="small text-muted mb-1">
          Success Rate: <span className="fw-medium text-success">{data.success_rate}%</span>
        </div>
        <div className="small text-muted">
          Orders Delivered: <span className="fw-medium text-dark">{data.orders}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function RiderPerformanceMatrix({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="sd-table-card p-4 h-100">
      <h5 className="fw-medium mb-1">Rider Performance Matrix</h5>
      <div className="small text-muted mb-4">
        Efficiency (Speed) vs Success Rate • Size = Orders Delivered
      </div>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid stroke="#f1f5f9" />
            <XAxis
              type="number"
              dataKey="efficiency_score"
              name="Efficiency"
              unit="%"
              tick={{ fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Efficiency Score",
                position: "bottom",
                offset: 0,
                fill: "#cbd5e1",
              }}
            />
            <YAxis
              type="number"
              dataKey="success_rate"
              name="Success Rate"
              unit="%"
              tick={{ fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <ZAxis
              type="number"
              dataKey="orders"
              range={[100, 500]}
              name="Orders"
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<CustomRiderTooltip />}
            />
            <Scatter name="Riders" data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.efficiency_score > 80
                      ? "#10b981"
                      : entry.efficiency_score > 60
                      ? "#3b82f6"
                      : "#f59e0b"
                  }
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
