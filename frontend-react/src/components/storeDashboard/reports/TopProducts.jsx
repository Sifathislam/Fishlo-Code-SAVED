export default function TopProducts({ topProducts }) {
  if (!topProducts || topProducts.length === 0) return null;

  return (
    <div className="col-lg-6">
      <div className="sd-table-card p-4 h-100">
        <h5 className="fw-medium mb-4">Top Performing Products</h5>
        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead className="text-secondary small">
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th className="text-end">Sell Amount</th>
                <th className="text-end">Sell Count</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((prod, idx) => (
                <tr key={idx} className="border-bottom-dashed">
                  <td className="py-3">
                    <div className="fw-medium text-dark">{prod.name}</div>
                    {prod.is_low_stock && (
                      <div
                        className="text-danger small"
                        style={{ fontSize: "0.7em" }}
                      >
                        Low Stock: {prod.stock_kg}kg
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-light text-secondary border fw-normal">
                      {prod.category}
                    </span>
                  </td>
                  <td className="text-end fw-medium text-dark">
                    ₹{prod.sell_amount.toLocaleString()}
                  </td>
                  <td className="text-end text-muted">
                    {prod.sell_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
