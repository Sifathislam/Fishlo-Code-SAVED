import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { useDashboardStats, useWithdrawalHistory, useRequestWithdrawal } from "../../features/useDeliveryAssignment";
import "./DeliveryWithdrawal.css";

const DeliveryWithdrawal = () => {
  const navigate = useNavigate();
  const { data: statsResponse, isLoading: isLoadingStats } = useDashboardStats();
  const { data: historyResponse, isLoading: isLoadingHistory } = useWithdrawalHistory();
  const requestMutation = useRequestWithdrawal();

  const walletBalance = parseFloat(statsResponse?.data?.wallet_balance || "0");
  const history = historyResponse?.data || [];

  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const amountRef = useRef(null);
  const upiIdRef = useRef(null);
  const bankAccountRef = useRef(null);
  const bankIfscRef = useRef(null);
  const bankNameRef = useRef(null);
  const accountNameRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError("");
    setSuccess("");

    const newErrors = {};
    const numAmount = parseFloat(amount);

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(numAmount) || numAmount < 100) {
      newErrors.amount = "Minimum withdrawal amount is ₹100";
    } else if (numAmount > walletBalance) {
      newErrors.amount = `Amount cannot exceed balance of ₹${walletBalance.toFixed(2)}`;
    }

    if (paymentMode === "upi") {
      const upiTrimmed = upiId.trim();
      if (!upiTrimmed) newErrors.upiId = "UPI ID is required";
      else if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiTrimmed)) newErrors.upiId = "Invalid UPI ID format";
    } else {
      const accountTrimmed = bankAccount.trim();
      const ifscTrimmed = bankIfsc.trim().toUpperCase();
      const bankNameTrimmed = bankName.trim();
      const nameTrimmed = accountName.trim();

      if (!accountTrimmed) newErrors.bankAccount = "Account number is required";
      else if (!/^\d{9,18}$/.test(accountTrimmed)) newErrors.bankAccount = "Invalid account number (9-18 digits)";

      if (!ifscTrimmed) newErrors.bankIfsc = "IFSC code is required";
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscTrimmed)) newErrors.bankIfsc = "Invalid IFSC format";

      if (!bankNameTrimmed) newErrors.bankName = "Bank name is required";
      else if (bankNameTrimmed.length < 2) newErrors.bankName = "Bank name too short";

      if (!nameTrimmed) newErrors.accountName = "Account holder name is required";
      else if (nameTrimmed.length < 2) newErrors.accountName = "Account holder name too short";
      else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) newErrors.accountName = "Only alphabets and spaces allowed";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      const refs = { 
        amount: amountRef, 
        upiId: upiIdRef, 
        bankAccount: bankAccountRef, 
        bankIfsc: bankIfscRef, 
        bankName: bankNameRef, 
        accountName: accountNameRef 
      };
      
      setTimeout(() => {
        refs[firstErrorField]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        refs[firstErrorField]?.current?.focus();
      }, 100);
      return;
    }

    const payload = {
      amount: numAmount,
      payment_mode: paymentMode,
      ...(paymentMode === "upi" ? { upi_id: upiId.trim() } : {
        bank_account_number: bankAccount.trim(),
        bank_ifsc: bankIfsc.trim().toUpperCase(),
        bank_name: bankName.trim(),
        account_holder_name: accountName.trim()
      })
    };

    try {
      await requestMutation.mutateAsync(payload);
      setSuccess("Withdrawal request submitted successfully!");
      setAmount("");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Failed to submit request.");
    }
  };

  return (
    <div className="delivery-withdrawal-wrapper pb-5 mb-5">
      <div className="delivery-header-with-back sticky-top bg-white z-2" style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <button className="icon-btn-light-solid" onClick={() => navigate(-1)} style={{ marginRight: '15px' }}>
          <i className="fa fa-arrow-left"></i>
        </button>
        <h2 className="header-brand m-0" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>Withdraw Funds</h2>
      </div>

      <div className="p-3">
        <div className="delivery-card solid-red-card mb-4" style={{ borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(220, 53, 69, 0.2)' }}>
          <div className="earnings-header mb-1">
            <h3 className="card-subtitle-small m-0" style={{ opacity: 0.9, fontSize: '0.85rem', fontWeight: '500' }}>Available Balance</h3>
          </div>
          {isLoadingStats ? (
            <Skeleton width={150} height={35} className="mt-1" />
          ) : (
            <p className="card-value-large mb-0" style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>₹ {walletBalance.toFixed(2)}</p>
          )}
        </div>

        <div className="delivery-card p-3 mb-4 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#fff' }}>
          <h4 className="section-title mb-3" style={{ fontSize: '1rem', fontWeight: '600', color: '#2b2b2b' }}>Request Withdrawal</h4>
          {globalError && <div className="alert alert-danger py-2 small">{globalError}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className={`form-group mb-3 ${fieldErrors.amount ? 'has-error' : ''}`} ref={amountRef}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="withdrawal-label m-0">Amount (₹)</label>
                <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>Min: ₹100</span>
              </div>
              <input
                type="number"
                className={`form-control custom-withdrawal-input ${fieldErrors.amount ? 'is-invalid' : ''}`}
                placeholder="Enter amount (Min ₹100)"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 10) setAmount(val);
                }}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                }}
                step="0.01"
              />
              {fieldErrors.amount && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{fieldErrors.amount}</div>}
            </div>

            <div className="form-group mb-3">
              <label className="withdrawal-label mb-2 d-block">Payment Mode</label>
              <div className="d-flex gap-2">
                <label className={`payment-mode-box flex-fill p-2 rounded text-center position-relative ${paymentMode === 'upi' ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="payment_mode" value="upi" checked={paymentMode === "upi"} onChange={(e) => setPaymentMode(e.target.value)} className="d-none" />
                  <i className="fa fa-qrcode mb-1 d-block" style={{ color: paymentMode === 'upi' ? 'var(--primary-color, #dc3545)' : '#6c757d', fontSize: '1.4rem', transition: 'color 0.2s' }}></i>
                  <span style={{ fontSize: '0.85rem', fontWeight: paymentMode === 'upi' ? '600' : '500', color: paymentMode === 'upi' ? 'var(--primary-color, #dc3545)' : '#495057' }}>UPI</span>
                </label>
                <label className={`payment-mode-box flex-fill p-2 rounded text-center position-relative ${paymentMode === 'bank_transfer' ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="payment_mode" value="bank_transfer" checked={paymentMode === "bank_transfer"} onChange={(e) => setPaymentMode(e.target.value)} className="d-none" />
                  <i className="fa fa-bank mb-1 d-block" style={{ color: paymentMode === 'bank_transfer' ? 'var(--primary-color, #dc3545)' : '#6c757d', fontSize: '1.4rem', transition: 'color 0.2s' }}></i>
                  <span style={{ fontSize: '0.85rem', fontWeight: paymentMode === 'bank_transfer' ? '600' : '500', color: paymentMode === 'bank_transfer' ? 'var(--primary-color, #dc3545)' : '#495057' }}>Bank Transfer</span>
                </label>
              </div>
            </div>

            {paymentMode === "upi" && (
              <div className={`form-group mb-4 ${fieldErrors.upiId ? 'has-error' : ''}`} ref={upiIdRef}>
                <label className="withdrawal-label d-block">UPI ID</label>
                <input 
                  type="text" 
                  className={`form-control custom-withdrawal-input ${fieldErrors.upiId ? 'is-invalid' : ''}`} 
                  placeholder="e.g., yourname@upi" 
                  value={upiId} 
                  onChange={(e) => setUpiId(e.target.value)} 
                  maxLength={100}
                />
                {fieldErrors.upiId && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{fieldErrors.upiId}</div>}
              </div>
            )}

            {paymentMode === "bank_transfer" && (
              <div className="bank-details-grid mb-4">
                <div className={`form-group mb-3 ${fieldErrors.bankAccount ? 'has-error' : ''}`} ref={bankAccountRef}>
                  <label className="withdrawal-label d-block">Account Number</label>
                  <input 
                    type="text" 
                    className={`form-control custom-withdrawal-input ${fieldErrors.bankAccount ? 'is-invalid' : ''}`} 
                    placeholder="e.g., 0000 0000 0000" 
                    value={bankAccount} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 18) setBankAccount(val);
                    }} 
                    maxLength={18}
                  />
                  {fieldErrors.bankAccount && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{fieldErrors.bankAccount}</div>}
                </div>
                <div className={`form-group mb-3 ${fieldErrors.bankIfsc ? 'has-error' : ''}`} ref={bankIfscRef}>
                  <label className="withdrawal-label d-block">IFSC Code</label>
                  <input 
                    type="text" 
                    className={`form-control custom-withdrawal-input ${fieldErrors.bankIfsc ? 'is-invalid' : ''}`} 
                    placeholder="e.g., SBIN0000001" 
                    value={bankIfsc} 
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} 
                    maxLength={11}
                  />
                  {fieldErrors.bankIfsc && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{fieldErrors.bankIfsc}</div>}
                </div>
                <div className={`form-group mb-3 ${fieldErrors.bankName ? 'has-error' : ''}`} ref={bankNameRef}>
                  <label className="withdrawal-label d-block">Bank Name</label>
                  <input 
                    type="text" 
                    className={`form-control custom-withdrawal-input ${fieldErrors.bankName ? 'is-invalid' : ''}`} 
                    placeholder="e.g., State Bank of India" 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                    maxLength={100}
                  />
                  {fieldErrors.bankName && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{fieldErrors.bankName}</div>}
                </div>
                <div className={`form-group ${fieldErrors.accountName ? 'has-error' : ''}`} ref={accountNameRef}>
                  <label className="withdrawal-label d-block">Account Holder Name</label>
                  <input 
                    type="text" 
                    className={`form-control custom-withdrawal-input ${fieldErrors.accountName ? 'is-invalid' : ''}`} 
                    placeholder="e.g., John Doe" 
                    value={accountName} 
                    onChange={(e) => setAccountName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))} 
                    maxLength={100}
                  />
                  {fieldErrors.accountName && <div className="text-danger small mt-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>{fieldErrors.accountName}</div>}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="delivery-btn btn-accept w-100 mt-2 submit-btn-hover"
              style={{ padding: '12px', fontSize: '1rem', fontWeight: '600', borderRadius: '8px' }}
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>

        <div className="delivery-card p-0 overflow-hidden mb-5 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#fff' }}>
          <h4 className="section-title p-3 border-bottom m-0" style={{ fontSize: '1rem', fontWeight: '600', color: '#2b2b2b' }}>Recent Withdrawals</h4>
          {isLoadingHistory ? (
            <div className="withdrawal-list p-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <Skeleton width={80} height={20} className="mb-1" />
                    <Skeleton width={140} height={15} />
                  </div>
                  <Skeleton width={60} height={24} borderRadius={6} />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-muted small">No withdrawal history found.</div>
          ) : (
            <div className="withdrawal-list">
              {history.map(item => (
                <div key={item.id} className="p-3 border-bottom d-flex justify-content-between align-items-center history-item-hover">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '1rem', color: '#333' }}>₹ {parseFloat(item.amount).toFixed(2)}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{new Date(item.requested_at).toLocaleDateString()} &middot; {item.payment_mode.toUpperCase() === 'UPI' ? 'UPI' : 'Bank Transfer'}</div>
                  </div>
                  <div className={`badge ${item.status === 'pending' ? 'bg-warning text-dark' : item.status === 'approved' ? 'bg-success' : 'bg-danger'}`} style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.3px' }}>
                    {item.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryWithdrawal;
