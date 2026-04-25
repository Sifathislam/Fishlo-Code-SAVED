import { useState } from "react";
import { createPortal } from "react-dom";

export default function RepeatCustomers({ repeatCustomers, isOpen, onClose }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!isOpen || !repeatCustomers || repeatCustomers.length === 0) return null;

  return createPortal(
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
      tabIndex="-1"
      role="dialog"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
        <div className="modal-content border-0 shadow-lg" style={{ maxHeight: '90vh' }}>
          <div className="modal-header border-bottom-0 pb-0">
            <div>
              <h5 className="modal-title fw-medium mb-1">Returning & Repeat Customers</h5>
              <p className="text-muted small mb-0">Customers who have ordered before</p>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body py-4 overflow-auto">
        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead className="text-secondary small border-bottom">
              <tr>
                <th style={{ minWidth: "250px", width: "25%" }}>
                  Customer Name
                </th>
                <th style={{ minWidth: "120px", width: "15%" }}>
                  Total Orders
                </th>
                <th style={{ minWidth: "120px", width: "15%" }}>Total Spent</th>
                <th style={{ minWidth: "120px", width: "15%" }}>Avg. Value</th>
                <th style={{ minWidth: "300px", width: "30%" }}>
                  Top Items Ordered
                </th>
              </tr>
            </thead>
            <tbody>
              {repeatCustomers.map((cust, idx) => (
                <tr key={idx} className="border-bottom-dashed">
                  <td className="py-3">
                    <div className="d-flex align-items-center gap-3">
                      {cust.profile_image ? (
                        <div className="flex-shrink-0">
                          <img
                            src={cust.profile_image}
                            alt={cust.name}
                            className="rounded-circle object-fit-cover border"
                            style={{ width: 40, height: 40 }}
                          />
                        </div>
                      ) : (
                        <div
                          className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-medium flex-shrink-0"
                          style={{ width: 40, height: 40, fontSize: "1rem" }}
                        >
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fw-medium text-dark">{cust.name}</div>
                        <div className="text-muted small d-flex align-items-center gap-2">
                          <span>
                            <i className="bi bi-telephone me-1"></i>
                            {cust.phone}
                          </span>
                          <span className="text-light-subtle">|</span>
                          <span>Last: {cust.last_order}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                      {cust.orders} Orders
                    </span>
                  </td>
                  <td className="fw-semibold text-dark fs-6">
                    ₹{cust.total_sell.toLocaleString()}
                  </td>
                  <td className="text-muted">
                    ₹
                    {cust.avg_order.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td>
                    {cust.items && cust.items.length > 0 ? (
                      <div className="d-flex flex-column gap-1">
                        {cust.items.map((item, id) => (
                          <div key={id} className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 flex-shrink-0" style={{ fontSize: "0.7rem", minWidth: "28px" }}>
                              x{item.qty}
                            </span>
                            <span className="text-dark small" style={{ maxWidth: "280px" }} title={item.name}>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">No items</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>
          <div className="modal-footer border-top-0 pt-0">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
