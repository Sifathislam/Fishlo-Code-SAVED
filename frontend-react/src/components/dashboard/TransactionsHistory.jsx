import { useState } from "react";
import { useGetTransactionHistory } from "../../features/useGetDashboard";
import Loader from "../../shared/components/Loader";
import DashboardPagination from "./DashboardPagination";

export default function TransactionHistory() {
  const [page, setPage] = useState(1);
  const {
    data: transactions,
    isPending,
    isError,
  } = useGetTransactionHistory(page);

  const transactionsList = transactions?.results || [];
  const totalCount = transactions?.count || 0;


  // Helper function for dynamic status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return "badge-success";
      case "PENDING":
        return "badge-processing";
      case "REFUNDED":
        return "bg-info bg-opacity-10 text-info";
      default:
        return "bg-light text-muted";
    }
  };
  if (isPending)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px", width: "100%" }}
      >
        <Loader />
      </div>
    );

  if (isError)
    return <div className="p-4 text-danger">Error loading history.</div>;

  return (
    <div className="fade-in">
      <title>Transaction History | Fishlo</title>
      {transactions.results?.length === 0 ? (
        <div className="col-12 text-center py-5">
          <i className="fas fa-map-marked-alt fa-3x text-light mb-3"></i>
          <p className="text-muted">No transactions found yet.</p>
        </div>
      ) : (
        <div className="card-custom p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-bottom border-light bg-white d-flex justify-content-between align-items-center">
            <h4
              className="fw-medium mb-0"
              style={{ color: "var(--fishlo-gray)" }}
            >
              Transaction History
            </h4>
            <span className="badge bg-soft-red rounded-pill px-3">
              {totalCount || 0} Total
            </span>
          </div>

          {/* --- DESKTOP VIEW: Visible on md and up --- */}
          <div className="d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="bg-light">
                  <tr className="text-muted small">
                    <th className="ps-4 py-3 fw-600">DATE & TIME</th>
                    <th className="py-3 fw-600">METHOD / REF ID</th>
                    <th className="py-3 fw-600">STATUS</th>
                    <th className="text-end pe-4 py-3 fw-600">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsList?.map((tx) => {
                    const [date, time] = tx?.formatted_date.split(", ");
                    return (
                      <tr key={`${tx?.type}-${tx?.id}`}>
                        <td className="ps-4">
                          <div className="fw-medium text-main">{date}</div>
                          <div
                            className="text-muted small"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {time}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className={`p-2 rounded-3 me-3 ${
                                tx.type === "refund"
                                  ? "bg-soft-red"
                                  : "bg-light"
                              }`}
                            >
                              <i
                                className={`fas ${
                                  tx.type === "refund"
                                    ? "fa-undo"
                                    : "fa-credit-card"
                                } text-brand`}
                              ></i>
                            </div>
                            <div>
                              <div className=" mb-0 small">
                                {tx.display_method}
                              </div>
                              <div
                                className="text-muted font-monospace"
                                style={{ fontSize: "0.7rem" }}
                              >
                                {tx.gateway_id || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge-soft ${getStatusBadge(tx.status)}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td
                          className={`text-end pe-4  ${
                            tx.status === "REFUNDED" ? "text-success" : ""
                          }`}
                        >
                          {tx.status === "REFUNDED" ? "+" : ""}₹{tx.amount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <DashboardPagination
              currentPage={page}
              totalCount={totalCount || 0}
              pageSize={transactions?.page_size || 10}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>

          {/* --- MOBILE VIEW: Visible on sm and down --- */}
          <div className="d-md-none p-3">
            {transactionsList?.map((tx) => (
              <div
                key={`${tx?.type}-${tx?.id}`}
                className="p-3 mb-3 rounded-4 border border-light shadow-sm bg-white"
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="d-block text-main">
                      {tx?.display_method}
                    </span>
                    <span
                      className="text-muted extra-small font-monospace"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {tx?.gateway_id}
                    </span>
                  </div>
                  <span
                    className={`badge-soft px-2 py-1 ${getStatusBadge(
                      tx?.status,
                    )}`}
                    style={{ fontSize: "0.6rem" }}
                  >
                    {tx?.status}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                    <i className="far fa-calendar-alt me-1"></i>{" "}
                    {tx?.formatted_date}
                  </div>
                  <div
                    className={`${
                      tx?.status === "REFUNDED" ? "text-success" : ""
                    }`}
                  >
                    {tx?.status === "REFUNDED" ? "+" : "-"}₹{tx?.amount}
                  </div>
                </div>
              </div>
            ))}
            <DashboardPagination
              currentPage={page}
              totalCount={totalCount}
              pageSize={transactionsList?.length || 10}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
