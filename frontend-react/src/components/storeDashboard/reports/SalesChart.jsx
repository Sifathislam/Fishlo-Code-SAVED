import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND_COLOR = "#d7574c";

export default function SalesChart({ chartData }) {
  if (!chartData || chartData.length === 0) return null;

  return (
    <div className="col-lg-8">
      <div className="sd-table-card p-4 h-100">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-medium mb-0">Sales Overview</h5>
          <div className="d-flex gap-2">
            <div className="d-flex align-items-center gap-2 small">
              <span
                className="badge rounded-circle p-1"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: BRAND_COLOR,
                }}
              >
                {" "}
              </span>{" "}
              Sell
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <span
                className="badge rounded-circle bg-info p-1"
                style={{ width: 8, height: 8 }}
              >
                {" "}
              </span>{" "}
              Orders
            </div>
          </div>
        </div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                unit="₹"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={(label, payload) => {
                  return payload[0]?.payload?.full_date || label;
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sell"
                stroke={BRAND_COLOR}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Sell"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                name="Orders"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
