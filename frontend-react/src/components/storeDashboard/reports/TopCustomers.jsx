export default function TopCustomers({ topCustomers }) {
  if (!topCustomers || topCustomers.length === 0) return null;

  return (
    <div className="col-lg-6">
      <div className="sd-table-card p-4 h-100">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-medium mb-0">Top Customers</h5>
          <button className="btn btn-link text-decoration-none small p-0">
            View All
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead className="text-secondary small">
              <tr>
                <th>Name</th>
                <th>Orders</th>
                <th>Total Sell</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((cust, idx) => (
                <tr key={idx} className="border-bottom-dashed">
                  <td className="py-3">
                    <div className="d-flex align-items-center gap-2">
                      {cust.profile_image ? (
                        <div className="flex-shrink-0">
                          <img
                            src={cust.profile_image}
                            alt={cust.name}
                            className="rounded-circle object-fit-cover border"
                            style={{ width: 32, height: 32 }}
                          />
                        </div>
                      ) : (
                        <div
                          className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-medium"
                          style={{
                            width: 32,
                            height: 32,
                            fontSize: "0.8rem",
                          }}
                        >
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fw-medium text-dark small">
                          {cust.name}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.7rem" }}
                        >
                          Last Order: {cust.last_order}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge bg-light text-muted border d-flex align-items-center justify-content-center pb-0"
                      style={{ height: "24px" }}
                    >
                      {cust.orders} Orders
                    </span>
                  </td>
                  <td className="fw-medium text-dark">
                    ₹{cust.total_sell.toLocaleString()}
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-light border">
                      <i className="bi bi-three-dots" />
                    </button>
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
