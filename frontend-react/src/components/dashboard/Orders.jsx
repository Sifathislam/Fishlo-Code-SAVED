import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetMyOrders } from "../../features/useGetDashboard";
import { useGetReconcile } from "../../features/useGetOrder";
import { useAxios } from "../../shared/hooks/useAxios";
import Loader from "../../shared/components/Loader";
import DashboardPagination from "./DashboardPagination";
import CancelOrderModal from "./CancelOrderModal";
import { formatDateTime } from "../../shared/utils/dateUtils";

export default function Orders() {
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [downloadingLoading, setDownloadingLoading] = useState(null);
  const { data: reconcile } = useGetReconcile();
  const { api } = useAxios();
  const navigate = useNavigate();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const {
    data: orders,
    isPending,
    isError,
    error,
  } = useGetMyOrders(statusFilter, page);

  const ordersList = orders?.results || [];
  const totalCount = orders?.count || 0;


  useEffect(() => {
    if (isPending) return;
    const stateOrderNumber = location.state?.orderNumber;

    if (stateOrderNumber && ordersList.length > 0) {
      const foundOrder = ordersList.find(
        (o) => String(o.order_number) === String(stateOrderNumber),
      );

      if (foundOrder) {
        navigate(`/dashboard/orders/tracking/${stateOrderNumber}`, {
          replace: true,
        });
      }
    }
  }, [location.state, ordersList, isPending]);



  const handleDownloadInvoice = async (invoiceData) => {
    const fileName = `Invoice-${invoiceData?.order_number || "Order"}.pdf`;
    if (invoiceData?.is_partial_pay) return;
    setDownloadingLoading(true);

    try {
      let blob;

      if (invoiceData?.order_invoice_pdf) {
        const res = await fetch(invoiceData.order_invoice_pdf);
        blob = await res.blob();
      } else if (invoiceData?.order_number) {
        const response = await api.get(
          `orders/invoice/download/${invoiceData.order_number}/`,
        );
        const data = response.data;

        if (data?.pdf_available && data?.pdf_link) {
          const pdfRes = await fetch(data.pdf_link);
          blob = await pdfRes.blob();
        } else {
          console.error("Invoice generation failed or link missing");
          return;
        }
      } else {
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloadingLoading(false);
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-warning text-dark";
      case "CONFIRMED":
        return "bg-success text-white";
      case "PROCESSING":
        return "bg-primary text-white";
      case "DELIVERED":
        return "bg-success text-white";
      case "CANCELLED":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const handleCancelClick = (order) => {
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return;
    }
    setOrderToCancel(order);
    setCancelModalOpen(true);
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
    return <div className="p-5 text-center text-danger">{error.message}</div>;

  if (location.state?.orderNumber) return;

  const formatPrice = (value) => {
    const num = Number(value);
    return Number.isInteger(num) ? num : num.toFixed(2);
  };


  return (
    <div className="fade-in">
      <title>My Orders | Fishlo</title>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-medium mb-0"></h4>
        <select
          className="form-select w-auto border-0 shadow-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          {/* <option value="DELIVERED">Delivered</option> */}
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {ordersList?.length === 0 ? (
        <div className="text-center p-5 rounded ">
          <p className="mb-0">
            No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} orders
            found.
          </p>
        </div>
      ) : (
        <div className="card-custom p-0 mb-3">
          {ordersList?.map((order) => (
            <div key={order?.id} className="p-0 mb-3">
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h6 className="fw-semibold mb-0 text-dark">
                        #{order?.order_number}
                      </h6>
                      <span
                        className={`badge ${getBadgeClass(order?.status)}`}
                        style={{ paddingBottom: "2px", paddingTop: "6px" }}
                      >
                        {order?.status_display}
                      </span>
                      {/* <span>{order.delivery_date}</span> */}
                    </div>
                    <p className="text-muted small mb-0">
                      <i className="far fa-clock me-1"></i>{" "}
                      {formatDateTime(order?.created_at)}
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="fs-5 fw-medium text-dark d-block">
                      ₹{order?.total_amount}
                    </span>
                    {order?.payment_method_display === "Cash On Delivery" && order?.status !== "CANCELLED" && (
                      <span className="badge bg-warning text-dark small mt-1">COD</span>
                    )}
                    {/* {order?.is_partial_pay && order?.status !== "CANCELLED" && (
                      <div className="d-flex flex-column small mt-1">
                        <span className="text-success fw-medium">Paid Online: ₹{order?.partial_pay}</span>
                        {parseFloat(order?.cash_collected) > 0 ? (
                          <span className="text-success fw-medium">Paid Cash: ₹{order?.cash_collected}</span>
                        ) : parseFloat(order?.remaining_amount) > 0 ? (
                          <span className="text-danger fw-medium">Due: ₹{order?.remaining_amount}</span>
                        ) : null}
                        {parseFloat(order?.remaining_amount) === 0 && (
                          <span className="text-success fw-bold mt-1">
                            <i className="fa-solid fa-circle-check me-1"></i> Fully Paid
                          </span>
                        )}
                      </div>
                    )} */}
                  </div>
                </div>
                {order?.order_items?.map((item) => (
                  <div
                    key={item?.id}
                    className="d-flex align-items-center gap-3 mb-4"
                  >
                    <img
                      src={
                        item?.product_image ||
                        "https://placehold.co/60x60?text=Item"
                      }
                      className="rounded-3"
                      style={{
                        width: "100px",
                        height: "60px",
                        objectFit: "fill",
                      }}
                      alt={item?.product_name}
                    />
                    <div>
                      <div
                        onClick={() => navigate(`/${item?.product_slug}`)}
                        className="fw-semibold mb-0 text-dark fs-sm"
                        style={{ cursor: "pointer" }}
                      >
                        {item?.product_name}
                        {item?.selected_cuts?.map((cut) => (
                          <div
                            key={cut.id}
                            className="text-muted d-flex align-items-center"
                            style={{ fontSize: "12px", fontWeight: "normal" }}
                          >
                            {cut.name}
                            {Number(cut.price) > 0 && (
                              <span className="fw-semibold ms-1">
                                (+₹{formatPrice(cut.price)})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <small className="text-muted d-block mb-1">
                        Qty: {item?.quantity} • {item?.weight} • ₹
                        {item?.subtotal}
                      </small>
                      {/* {item?.expected_net_weight && (
                        <div
                          className="d-inline-flex align-items-center gap-1 mt-1 expected-weight-badge"
                          style={{
                            color: "#2d6a3f",
                            backgroundColor: "#f0f7f0",
                            borderRadius: "4px",
                            border: "1px solid #d4edda",
                            padding: "2px 6px",
                            fontSize: "11px",
                            fontWeight: "500",
                          }}
                        >
                          <i
                            className="fa-solid fa-fish"
                            style={{ color: "#28a745" }}
                          ></i>
                          <span>{item.expected_net_weight}</span>
                        </div>
                      )} */}
                    </div>
                  </div>
                ))}

                <div className="d-flex gap-2 mt-3">
                  {order?.status !== "CANCELLE" ? (
                    <button
                      className="btn btn-brand btn-sm flex-grow-1 flex-md-grow-0"
                      onClick={() =>
                        navigate(
                          `/dashboard/orders/tracking/${order?.order_number}`,
                        )
                      }
                    >
                      Track Order
                    </button>
                  ) : (
                    ""
                  )}
                  {(order?.status === "PENDING" || order?.status === "CONFIRMED") ? (
                    <button
                      className="btn btn-outline-danger btn-sm flex-grow-1 flex-md-grow-0"
                      onClick={() => handleCancelClick(order)}
                    >
                      Cancel Order
                    </button>
                  ) : null}
                  {!order?.is_partial_pay && order?.payment_method_display !== "Cash On Delivery" && order?.status !== "CANCELLED" && order?.status === "PENDING" && order?.payment_status !== "PENDING"? (
                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      disabled={downloadingLoading}
                      className="btn-fishlo-invoice d-flex align-items-center justify-content-center"
                      style={{ minWidth: "100px" }}
                    >
                      {downloadingLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-file-download me-2"></i>
                          Invoice
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          <DashboardPagination
            currentPage={page}
            totalCount={totalCount || 0}
            pageSize={orders?.page_size || 10}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setOrderToCancel(null);
        }}
        orderNumber={orderToCancel?.order_number}
        orderStatus={orderToCancel?.status}
      />
    </div>
  );
}
