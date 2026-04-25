import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAssignmentDetail, useVerifyDeliveryOTP } from "../../features/useDeliveryAssignment";
import OrderDetailSkeleton from "./skeletons/OrderDetailSkeleton";
import { useSendDeliveryOTP } from "../../features/useDeliveryAssignment";
const DeliveryOrderDetail = () => {
  const { id } = useParams(); // This will be the order_number
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const inputRefs = useRef([]);
  const verifyOtpMutation = useVerifyDeliveryOTP();
  const sendOtpMutation = useSendDeliveryOTP();
  const [otpSent, setOtpSent] = useState(false);

  const { data: assignmentResponse, isLoading, error } = useAssignmentDetail(id);
  const order = assignmentResponse?.data?.order;
  const assignment = assignmentResponse?.data;

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  const handleVerifyOtp = () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setVerifyMsg({ type: "error", text: "Please enter a valid 6-digit OTP." });
      return;
    }
    
    setVerifyMsg(null);
    
    verifyOtpMutation.mutate(
      { order_number: order.order_number, otp_code: otpCode },
      {
        onSuccess: (data) => {
          if (data.success) {
            setVerifyMsg({ type: "success", text: "OTP verified successfully! Order is delivered." });
            setOtp(["", "", "", "", "",""]);
          } else {
            setVerifyMsg({ type: "error", text: data.message || "Invalid or expired OTP." });
            setOtp(["", "", "", "", "",""]);
          }
        },
        onError: (err) => {
          const errorMessage = err.response?.data?.message || err.message || "Failed to verify OTP. Please try again.";
          setVerifyMsg({ type: "error", text: errorMessage });
          setOtp(["", "", "", "", "",""]);
        }
      }
    );
  };


  
const handleSendOtp = () => {
 if (!order?.order_number) {
    setVerifyMsg({ type: "error", text: "Order not loaded yet." });
    return;
  }

  setVerifyMsg(null);

  sendOtpMutation.mutate(
    { order_number: order.order_number },
    {
      onSuccess: (data) => {
        if (data.success) {
          setOtpSent(true);
          setVerifyMsg({
            type: "success",
            text: "OTP sent successfully!",
          });
        } else {
          setVerifyMsg({
            type: "error",
            text: data.message || "Failed to send OTP.",
          });
        }
      },
      onError: (err) => {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Error sending OTP.";
        setVerifyMsg({ type: "error", text: errorMessage });
      },
    }
  );
};
  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="detail-page-wrapper">
        <div className="alert alert-danger m-3" role="alert">
          <p>Failed to load order details. It may not exist or you might not have permission.</p>
          <button className="btn btn-outline-danger btn-sm" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page-wrapper">
      <div className="detail-content-padding">

        <div className="page-title-box">
          <button onClick={() => navigate(-1)} className="back-btn-round">
            <i className="fa fa-chevron-left icon-blue-small"></i>
          </button>
          <h4 className="detail-page-title">Order Details</h4>
        </div>

        {/* Order ID Card */}
        <div className="detail-card-white">
          <span className="label-muted-small">ORDER ID</span>
          <div className="order-id-row">
            <div className="order-id-value">
              <span>#</span>{order.order_number}
            </div>
            <div className="status-badge-accent">
              {order.status.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Customer Detail Card */}
        <div className="detail-card-white">
          <div className="customer-detail-header">
            <div className="customer-avatar-circle">
              <i className="fa fa-user icon-user-large"></i>
            </div>
            <div>
              <h3 className="customer-info-title">{order.address?.full_name || 'Customer'}</h3>
              <p className="customer-info-subtitle">Customer</p>
            </div>
          </div>

          <div className="address-box-detail">
            <i className="fa fa-map-marker icon-marker-red"></i>
            <div>
              <p className="address-text-bold">{order.address?.house_details}</p>
              <p className="address-text-muted">{order.address?.address_line_2}</p>
              <p className="address-text-muted">{order.address?.city}</p>
            </div>
          </div>

          <div className="action-btns-row">
            {order.address?.phone && (
              <a href={`tel:${order.address.phone}`} className="btn-action-call">
                <i className="fa fa-phone"></i> Call
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${order.address?.house_details || ''}, ${order.address?.city || ''}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action-navigate"
            >
              <i className="fa fa-map"></i> Navigate
            </a>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="detail-card-white">
          <h3 className="section-title-blue">Payment Info</h3>

          <div className="summary-item-row dashed-border">
            <span className="summary-label">Your Earning</span>
            <span className="summary-value-bold text-success">₹ {order.delivery_charge || '0.00'}</span>
          </div>

          {/* Cash Collection Status — the only thing the rider needs */}
          {(() => {
            const remaining = parseFloat(order.remaining_amount) || 0;
            const cashCollected = parseFloat(order.cash_collected) || 0;

            // Already collected
            if (cashCollected > 0) {
              return (
                <div className="summary-item-row" style={{backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '10px 12px', marginTop: '8px'}}>
                  <span className="summary-label fw-bold text-success">✅ Cash Collected</span>
                  <span className="summary-value-bold text-success">₹{order.cash_collected}</span>
                </div>
              );
            }

            // Need to collect cash
            if (remaining > 0) {
              return (
                <div className="summary-item-row" style={{backgroundColor: '#fff7ed', borderRadius: '8px', padding: '12px 14px', marginTop: '8px'}}>
                  <span className="summary-label fw-bold text-danger">💰 Collect Cash</span>
                  <span className="summary-value-bold text-danger" style={{fontSize: '1.2rem'}}>₹{order.remaining_amount}</span>
                </div>
              );
            }

            // Nothing to collect
            return (
              <div className="summary-item-row" style={{backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '10px 12px', marginTop: '8px'}}>
                <span className="summary-label fw-bold text-success">✅ Prepaid</span>
                <span className="summary-value-bold text-success">No cash collection</span>
              </div>
            );
          })()}
        </div>
        <div className="otp-verify-card">
          <h3 className="section-title-blue verify-title-center">Verify Delivery</h3>
          {order.status !== 'DELIVERED' ? (
            <>
              <p className="otp-subtitle-center">Ask customer for 6-digit PIN</p>

              <div className="otp-inputs-row">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="otp-digit-input-detail"
                    maxLength={1}
                    ref={(el) => (inputRefs.current[i] = el)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={sendOtpMutation.isPending || verifyOtpMutation.isPending}
                  />
                ))}
              </div>

              {verifyMsg && (
                <div style={{
                  color: verifyMsg.type === 'error' ? '#ef4444' : verifyMsg.type === 'success' ? '#10b981' : '#64748b',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  fontWeight: '500'
                }}>
                  <i className={`fa fa-${verifyMsg.type === 'error' ? 'exclamation-circle' : verifyMsg.type === 'success' ? 'check-circle' : 'info-circle'} me-1`}></i> 
                  {verifyMsg.text}
                </div>
              )}

              <button
                className="btn-send-otp mb-3"
                onClick={handleSendOtp}
                disabled={sendOtpMutation.isPending || !order}
              >
                {sendOtpMutation.isPending ? (
                  <><i className="fa fa-spinner fa-spin me-2"></i> Sending OTP...</>
                ) : (
                  <>Send OTP <i className="fa fa-paper-plane ms-2"></i></>
                )}
              </button>
              
              <button 
                className="btn-confirm-delivery"
                onClick={handleVerifyOtp}
                disabled={!otpSent || verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? (
                  <><i className="fa fa-spinner fa-spin me-2"></i> Verifying...</>
                ) : (
                  <>Confirm Delivery <i className="fa fa-check-circle ms-2"></i></>
                )}
              </button>
            </>
          ) : (
            <div className="alert alert-success mt-3 text-center">
              <i className="fa fa-check-circle me-1"></i> Order is successfully delivered.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DeliveryOrderDetail;
