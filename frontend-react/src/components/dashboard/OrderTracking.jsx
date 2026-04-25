import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetOrderTracking } from "../../features/useGetDashboard";
import { formatCustomDateString, formatDateTime } from "../../shared/utils/dateUtils";
import Loader from "../../shared/components/Loader";
import CancelOrderModal from "./CancelOrderModal";

export default function OrderTracking() {
  const { orderId } = useParams();
  const { data, isPending, isError } = useGetOrderTracking(orderId);
  const [showPhone, setShowPhone] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const deliveryMan = data?.delivery_man;
  const navigate = useNavigate();
  const SUPPORT_NUMBER = "+919619600049";

  const getStepIcon = (status) => {
    switch (status) {
      case "PENDING":
      case "CONFIRMED":
        return "fas fa-check";
      case "PROCESSING":
        return "fas fa-box-open";
      case "PACKED":
      case "ASSIGNING":
      case "ASSIGN":
        return "fas fa-dolly";
      case "OUT_FOR_DELIVERY":
        return "fas fa-truck";
      case "DELIVERED":
        return "fas fa-home";
      case "CANCELLED":
        return "fas fa-times-circle text-danger";
      default:
        return "fas fa-circle";
    }
  };
  const handleSupportClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // If mobile, open the dialer
      window.location.href = `tel:${SUPPORT_NUMBER}`;
    } else {
      // If desktop, just show the number in the button
      setShowPhone(true);
    }
  };
  const handleBack = () => navigate("/dashboard/orders");

  const handleCancelClick = () => {
    if (
      data?.current_status !== "PENDING" &&
      data?.current_status !== "CONFIRMED"
    ) {
      return;
    }
    setCancelModalOpen(true);
  };

  const handleCall = (phone) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `tel:${phone}`;
    } else {
      navigator.clipboard.writeText(phone);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };
  return (
    <>
      <div className="fade-in">
        <title>Track Order | Fishlo</title>
        <div className="card-custom">
          {isPending ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "400px", width: "100%" }}
            >
              <Loader />
            </div>
          ) : isError ? (
            <div
              className="d-flex flex-column justify-content-center align-items-center text-center"
              style={{ minHeight: "400px", width: "100%" }}
            >
              <div className="mb-3 text-muted">
                <i className="fas fa-search-location fa-3x"></i>
              </div>
              <h5 className="fw-medium text-dark">Tracking Unavailable</h5>
              <p className="text-muted mb-4">
                We couldn't retrieve the tracking details for this order at the
                moment.
              </p>
              <button
                className="btn btn-outline-secondary px-4"
                onClick={handleBack}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Orders
              </button>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button className="back-btn" onClick={handleBack}>
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Orders
                </button>
                {(data?.current_status === "PENDING" ||
                  data?.current_status === "CONFIRMED") && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleCancelClick}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                  <small className="text-uppercase text-muted fw-medium">
                    Order ID
                  </small>
                  <h4 className="fw-medium mb-0">#{data.order_number}</h4>
                </div>
                <div className="text-end">
                  <small className="text-uppercase text-muted fw-medium">
                    Est. Delivery
                  </small>
                  <p className="fw-medium text-brand mb-0">
                    {data.delivery_time
                      ? formatCustomDateString(data.delivery_time)
                      : "Calculating..."}
                  </p>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-8 border-end border-light">
                  <div className="py-2">
                    {data?.timeline?.map((step, index) => {
                      const isCompleted = step.completed ? "completed" : "";
                      const isActive = step.is_current ? "active" : "";
                      const titleColor =
                        step.is_current || step.completed
                          ? "text-brand"
                          : "text-black-50 opacity-50";
                      return (
                        <div
                          key={index}
                          className={`timeline-step ${isCompleted} ${isActive}`}
                        >
                          <div className="timeline-marker">
                            <i className={getStepIcon(step.status)}></i>
                          </div>
                          <div>
                            <h6 className={`fw-medium mb-1 ${titleColor}`}>
                              {step.status_display}
                            </h6>
                            <p className="text-black-50 opacity-50 small mb-2">
                              {step.timestamp
                                ? formatDateTime(step.timestamp)
                                : step.notes || "Pending"}
                            </p>
                            {step.status === "PROCESSING" && (
                              <div className="mt-2">
                                {isCompleted ? (
                                  <div className="bg-white p-2 rounded small text-success d-inline-block border border-success">
                                    <i className="fas fa-check-circle me-1"></i>
                                    Quality checked done
                                  </div>
                                ) : (
                                  <div className="bg-light p-2 rounded small text-black-50 opacity-50 d-inline-block border">
                                    <i className="fas fa-info-circle me-1 text-black-50 opacity-50"></i>{" "}
                                    Quality check in progress
                                  </div>
                                )}
                              </div>
                            )}
                            {step.status === "CANCELLED" && step.notes && (
                              <div className="mt-2">
                                <div className="bg-danger-subtle p-2 rounded small text-danger d-inline-block border border-danger-subtle">
                                  <i className="fas fa-info-circle me-1"></i>
                                  Reason: {step.notes}
                                </div>
                              </div>
                            )}
                            {(step.status === "ASSIGNING" || step.status === "ASSIGN") &&
                              (step.is_current || step.completed) && (
                                <div className="mt-2">
                                  {!step.assignToDelivery && !step.completed ? (
                                    <div className="bg-light p-2 rounded small text-dark d-inline-block border">
                                      <div className="d-flex align-items-center">
                                        <i className="fas fa-user-clock me-2 text-muted"></i>
                                        <span>
                                          Assigning delivery person...
                                        </span>
                                        <div
                                          className="spinner-border spinner-border-sm ms-2 text-muted"
                                          role="status"
                                          style={{
                                            width: "0.8rem",
                                            height: "0.8rem",
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-white p-2 rounded small text-success d-inline-block border border-success">
                                      <i className="fas fa-user-check me-1"></i>
                                      Delivery person assigned
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="col-lg-4 ps-lg-4 pt-4 pt-lg-0">
                  <div className="mb-4">
                    <h6 className="fw-medium text-muted small text-uppercase tracking-1">
                      Delivery Partner
                    </h6>

                    <div className="delivery-card">
                      <div className="d-flex align-items-center mb-3">
                          <div className="delivery-avatar">
                            {deliveryMan?.profile_image ? (
                              <img
                                src={deliveryMan.profile_image}
                                alt={deliveryMan?.name || "Delivery Man"}
                                className="img-fluid rounded-circle"
                              />
                            ) : (
                              <i className="fas fa-user"></i>
                            )}
                          </div>
                        <div className="ms-3">
                          {deliveryMan ? (
                            <>
                              <h6 className="mb-1 text-dark">
                                {deliveryMan.name}
                              </h6>

                              <small className="text-muted d-block">
                                {deliveryMan.vehicle_type} •{" "}
                                {deliveryMan.is_active_duty ? "Active Now" : "Offline"}
                              </small>
                            </>
                          ) : (
                            <>
                              <h6 className="mb-1 text-dark">
                                Delivery Partner Not Assigned Yet
                              </h6>

                              <small className="text-muted">
                                We’ll notify you once the delivery partner is assigned
                              </small>
                            </>
                          )}
                        </div>
                      </div>

                    <button
                      className="btn btn-outline-secondary w-100 btn-sm py-2 fw-medium"
                      disabled={!deliveryMan}
                      onClick={() => handleCall(deliveryMan?.phone_number)}
                    >
                      <i className="fas fa-phone-alt me-2"></i>
                      {copied ? "Phone Number Copied" : "Call Rider"}
                    </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-medium text-muted small text-uppercase tracking-1">
                      Delivery Destination
                    </h6>

                    <div className="destination-box">
                      <div className="text-brand me-3">
                        <i className="fas fa-map-marker-alt fa-lg"></i>
                      </div>

                      <div>
                        <p className="fw-medium mb-1 small text-dark">
                          Home Address
                        </p>
                        <p className="small text-muted mb-0 lh-sm">
                          {data?.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="support-box">
                    <h6 className="fw-medium mb-2 small text-dark">
                      Need Help?
                    </h6>
                    <p className="text-muted small mb-3">
                      Our support team is here to assist you regarding delivery
                      issues or order updates.
                    </p>

                    <button
                      className="btn btn-brand w-100 btn-sm py-2 fw-medium"
                      onClick={handleSupportClick}
                    >
                      <i className="fas fa-headset me-2"></i>
                      {showPhone ? SUPPORT_NUMBER : "Contact Support"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        orderNumber={data?.order_number}
        orderStatus={data?.current_status}
        onSuccess={() => {
          navigate("/dashboard/orders");
        }}
      />
    </>
  );
}
