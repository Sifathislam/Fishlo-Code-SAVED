import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function CategoryChart({ categoryData }) {
  if (!categoryData || categoryData.length === 0) return null;

  return (
    <div className="col-lg-4">
      <div className="sd-table-card p-4 h-100">
        <h5 className="fw-medium mb-4">Sales by Category</h5>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          {categoryData.map((cat) => (
            <div
              key={cat.name}
              className="d-flex justify-content-between align-items-center mb-3"
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle"
                  style={{ width: 10, height: 10, background: cat.color }}
                ></div>
                <span className="small fw-semibold text-dark">
                  {cat.name}
                </span>
              </div>
              <span className="small fw-medium">{cat.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
