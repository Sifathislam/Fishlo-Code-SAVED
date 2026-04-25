import { useEffect } from "react";
import ReactGA from "react-ga4";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../shared/components/Loader";
import { useDownloadInvoice } from "../features/useCreateOrder";
import { useGetOrderSuccess } from "../features/useGetOrder";
import "../styles/PaymentStatus.css";
import { formatDate } from "../shared/utils/dateUtils";
const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract order_id and payment_id from the URL query string
  const orderId = searchParams.get("order_id");
  const { data: order, isLoading, isError } = useGetOrderSuccess(orderId);
  const canDownloadInvoice = order && !order?.price_details?.is_partial_pay;
  const { data: invoiceData, isLoading: isInvoiceLoading } = useDownloadInvoice(
    canDownloadInvoice ? orderId : null,
  );

  useEffect(() => {
    if (order && !isLoading && !isError) {
      ReactGA.event("purchase", {
        transaction_id: order.order_number,
        value: order.price_details?.total_paid || order.price_details?.subtotal,
        currency: "INR",
        items: order.order_items?.map((item) => ({
          item_id: item.product_slug,
          item_name: item.product_name,
          price: item.subtotal,
          quantity: item.quantity,
        })),
      });
    }
  }, [order, isLoading, isError]);

  if (isLoading) {
    return (
      <div
        className="vh-100 d-flex align-items-center justify-content-center"
        style={{ marginTop: "-120px" }}
      >
        <Loader />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="order-success-wrapper text-center mt-5">
        <h3>Order not found</h3>
        <p>We couldn't find the details for order: {orderId}</p>
      </div>
    );
  }

  const handleDownloadInvoice = async () => {
    if (!invoiceData?.pdf_link) return;

    try {
      const res = await fetch(invoiceData.pdf_link, {
        method: "GET",
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      // Rename
      a.download = `Invoice-${order?.order_number || "Order"}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Error handling
    }
  };

  const formatPrice = (value) => {
    const num = Number(value);
    return Number.isInteger(num) ? num : num.toFixed(2);
  };

  const handleGoToOrders = () => {
    navigate("/dashboard/orders", {
      state: { orderNumber: order?.order_number },
    });
  };


  return (
    <div className="order-success-wrapper">
      <title>Order Success | Fishlo</title>
      <main className="order-success-main-content">
        <div className="order-success-container">
          <div className="row g-4">
            <div className="col-lg-8 order-1">
              {/* Hero Status Card */}
              <div className="order-success-hero-card">
                <div className="order-success-hero-header">
                  <div className="order-success-icon-box">
                    <i className="bi bi-check2-circle"></i>
                  </div>
                  <div>
                    <h2 className="fw-medium mb-1">Order Confirmed!</h2>
                    <p className="text-muted mb-0">
                      Placed successfully using{" "}
                      <strong>{order?.address?.phone}</strong>
                    </p>
                  </div>
                </div>

                <div className="order-success-info-grid">
                  <div className="info-item">
                    <div className="order-success-label">Order Number</div>
                    <div className="order-success-value order-success-text-brand">
                      #{order?.order_number}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="order-success-label">Expected Delivery</div>
                    <div className="order-success-value">
                      {formatDate(
                        order?.estimated_delivery_date || "Processing",
                      )}
                      <br />
                      {order?.delivery_slot_label}
                    </div>
                  </div>
                  <div className="info-item d-none d-sm-block">
                    <div className="order-success-label">Payment</div>
                    <div className="order-success-value">
                      {order?.payment_method_display}
                    </div>
                  </div>
                  <div className="info-item d-none d-sm-block">
                    <div className="order-success-label">Type</div>
                    <div className="order-success-value">
                      <i
                        className={`bi ${
                          order?.address?.address_type?.toLowerCase() === "home"
                            ? "bi-house-door"
                            : "bi-building"
                        } me-1`}
                      ></i>
                      {order?.address?.address_type}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <div className="order-success-label">Delivery Address</div>
                  <div className="order-success-value text-muted fw-normal mt-1">
                    {order?.address?.full_address}
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="order-success-items-container">
                <div className="p-3 border-bottom">
                  <h5 className="mb-0">Ordered Items</h5>
                </div>

                {/* Desktop View Table */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table order-success-table mb-0">
                    <thead>
                      <tr
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                        }}
                      >
                        <th>PRODUCT</th>
                        <th>WEIGHT</th>
                        <th>QTY</th>
                        <th className="text-end">PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.order_items?.map((item) => (
                        <tr key={item?.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={item?.product_image}
                                className="order-item-img rounded-3 me-3"
                                alt={item?.product_name}
                              />
                              <div
                                onClick={() =>
                                  navigate(`/${item?.product_slug}`)
                                }
                                style={{ cursor: "pointer" }}
                              >
                                {item?.product_name}
                                {item?.selected_cuts?.length > 0 && (
                                  <div className="d-flex flex-column gap-1">
                                    {item.selected_cuts.map((cut) => (
                                      <div
                                        key={cut.id}
                                        className="d-flex align-items-center text-muted small"
                                      >
                                        <span style={{ fontSize: "12px" }}>
                                          • {cut.name}
                                        </span>
                                        {Number(cut.price) > 0 && (
                                          <span
                                            className="badge rounded-pill bg-light text-dark border ms-2"
                                            style={{
                                              fontSize: "10px",
                                              fontWeight: "600",
                                            }}
                                          >
                                            +₹{formatPrice(cut.price)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="pt-4">{item?.weight_option_label_snapshot ? item.weight_option_label_snapshot : item.weight}</td>
                          <td className="whitespace-nowrap pt-4">
                            {/* {item?.weight}
                            <X
                              size={12}
                              className="inline mx-1 align-middle"
                              strokeWidth={3}
                            /> */}
                            {item?.quantity}
                          </td>
                          <td className="text-end pt-4">
                            ₹{formatPrice(item?.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View List */}
                <div className="d-md-none">
                  {order?.order_items?.map((item) => (
                    <div key={item?.id} className="mobile-product-item">
                      <img
                        className="rounded-3"
                        src={item?.product_image}
                        alt={item?.product_name}
                      />
                      <div className="flex-grow-1">
                        <div className="product-name">{item?.product_name}</div>
                        <div className="product-qty">
                          <span>{item?.weight} </span>
                          {/* <X
                            size={14}
                            strokeWidth={2.5}
                            className="inline-block mx-1"
                          /> */}
                          •<span>{item?.quantity}</span>
                        </div>
                        {item?.selected_cuts?.map((cut) => (
                          <div
                            key={cut.id}
                            className="text-muted d-flex align-items-center"
                            style={{ fontSize: "12px" }}
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
                      <div className="product-price">
                        ₹{formatPrice(item?.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Shows second on desktop, and BELOW items on mobile */}
            <div className="col-lg-4 order-2">
              <div className="order-success-summary-card-sticky">
                <div className="order-success-summary-card">
                  <h5 className="fw-medium mb-4">Price Details</h5>

                  <div className="order-success-summary-row">
                    <span className="text-muted">
                      Subtotal (
                      <span className="fw-semibold text-success">
                        {order?.order_items?.length} items
                      </span>
                      )
                    </span>
                    <span className="fw-semibold">
                      ₹{order?.price_details?.subtotal}
                    </span>
                  </div>
                  <div className="order-success-summary-row">
                    <span className="text-muted">Delivery Fee</span>
                    <span
                      className={
                        order?.price_details?.delivery_fee === 0
                          ? "text-success fw-medium"
                          : "fw-semibold"
                      }
                    >
                      {order?.price_details?.delivery_fee === 0
                        ? "FREE"
                        : `₹${order?.price_details?.delivery_fee}`}
                    </span>
                  </div>
                  {order?.price_details?.discount_value > 0 && (
                    <>
                      <div className="order-success-summary-row">
                        <span className="text-muted">
                          Discount{" "}
                          {order?.price_details?.discount_code &&
                            `(${order?.price_details?.discount_code})`}
                        </span>
                        <span className="text-success fw-semibold">
                          -₹{order?.price_details?.discount_value}
                        </span>
                      </div>
                    </>
                  )}
                  {order?.price_details?.adjustable_amount > 0 && (
                    <>
                      <div className="order-success-summary-row">
                        <span className="text-muted">Rounding Off </span>
                        <span className="text-success fw-semibold">
                          -₹{order?.price_details?.adjustable_amount}
                        </span>
                      </div>
                    </>
                  )}

                  <hr className="my-3 text-muted" />

                  {/* {order?.price_details?.is_partial_pay ? (
                    <>
                      <div className="order-success-summary-row">
                        <span className="text-muted">Total Order Value</span>
                        <span className="fw-medium">
                          ₹{order?.price_details?.subtotal}
                        </span>
                      </div>

                      <div className="order-success-summary-row mt-2">
                        <span className="text-success fw-medium">
                          <i className="bi bi-check-circle-fill me-1"></i> Paid
                          Now
                        </span>
                        <span className="text-success fw-medium">
                          ₹{order?.price_details?.partial_pay}
                        </span>
                      </div>

                      <div className="order-success-total-row mt-2">
                        <span>Due on Delivery</span>
                        <span className="text-danger">
                          ₹{order?.price_details?.remaining_amount}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="order-success-total-row">
                      <span>Total Paid</span>
                      <span className="order-success-text-brand">
                        ₹{order?.price_details?.total_paid}
                      </span>
                    </div>
                  )} */}

                  {order?.payment_method_display === "Cash On Delivery" ? (
                    <div className="order-success-total-row">
                      <span>Amount Due (COD)</span>
                      <span className="order-success-text-brand text-danger">
                        ₹{order?.price_details?.total_amount || order?.price_details?.total_paid || order?.price_details?.subtotal}
                      </span>
                    </div>
                  ) : (
                    <div className="order-success-total-row">
                      <span>Total Paid</span>
                      <span className="order-success-text-brand">
                        ₹{order?.price_details?.total_paid}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-2">
                    <button
                      onClick={handleGoToOrders}
                      className="order-success-btn-primary mb-3"
                    >
                      <i className="bi bi-geo-alt-fill me-1"></i> Track Order
                    </button>
                    {/* Enable invoice for all non-partial pay or COD */}
                    {(order?.price_details?.is_partial_pay || order?.payment_method_display === "Cash On Delivery" || order?.payment_method_display === "COD") ? null : (
                      <button
                        onClick={handleDownloadInvoice}
                        disabled={
                          isInvoiceLoading || !invoiceData?.pdf_available
                        }
                        className="btn w-100 fw-medium btn-light text-muted border py-3 rounded-4"
                      >
                        {isInvoiceLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Loading...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-file-earmark-pdf me-2"></i>
                            Download Invoice
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Support Card */}
                <div className="order-success-support-card">
                  <div className="icon-circle">
                    <i className="bi bi-telephone-outbound"></i>
                  </div>
                  <div>
                    <div className="fw-medium small">Need help?</div>
                    <a
                      href="tel:+919834343436"
                      className="order-success-text-brand small text-decoration-none fw-medium"
                    >
                      Call: +919619600049
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSuccess;
