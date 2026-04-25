import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../shared/api";
import { useMergeAddress } from "../features/useAddress";
import { useMergeCart } from "../features/useCart";
import useAuth from "../hooks/useAuth";

export default function OtpVerifyRightSideForm({
  setOpenLogin,
  setOtpMessage,
  sessionId,
  setSessionId,
  phoneNumber,
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendError, setResendError] = useState("");
  const [verifyCountdown, setVerifyCountdown] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(null);
  const localCartId = localStorage.getItem("cart_id");
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { mutate: mergeCart } = useMergeCart();
  const { mutate: mergeAddress } = useMergeAddress();
  const queryClient = useQueryClient();
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    // Validate OTP
    if (!otp || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("verify-otp/", {
        session_id: sessionId,
        otp: otp.trim(),
      });

      const { tokens, user } = response.data;
      if (tokens && user) {
        const { access, refresh } = tokens;
        setAuth({ authToken: access, refreshToken: refresh });
        // Access token — 15 minutes
        document.cookie = `__Host-auth=${access}; Max-Age=${
          15 * 60
        }; Path=/; Secure; SameSite=Strict`;
        document.cookie = `__Host-refresh=${refresh}; Max-Age=${
          7 * 24 * 60 * 60
        }; Path=/; Secure; SameSite=Strict`;
      }
      queryClient.invalidateQueries({ queryKey: ["user-profile","get-product-delivery-time"] });
      // Close modal
      setOpenLogin(false);

      if (localCartId) {
        mergeCart(localCartId);
      }
      mergeAddress();

      // Navigate to home
      // navigate("/", { replace: true });
    } catch (err) {
      // console.error("OTP Verification Error:", err.response?.data);
      const data = err.response?.data;

      // Server error message from backend
      if (data) {
        if (data.retry_after_seconds) {
          setVerifyCountdown(data.retry_after_seconds);
        }
        setError(data.error || data.detail || "Verification failed.");
      } else {
        setError("Unable to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleResendOtp = async () => {
    setResendSuccess("");
    setOtpMessage("");
    setError("");
    setResendLoading(true);

    try {
      const response = await api.post(
        `${import.meta.env.VITE_SERVER_BASE_URL}/send-otp/`,
        {
          phone_number: `+91${phoneNumber}`,
        }
      );
      setSessionId(response.data.session_id);
      setResendSuccess("A new verification code has been sent to your number.");
    } catch (err) {
      const data = err.response?.data;

      if (data) {
        setResendError(data.error || data?.detail || data.phone_number[0]);
        if (data.retry_after_seconds) {
          setResendCountdown(data.retry_after_seconds);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

useEffect(() => {
  const timer = setInterval(() => {
    // Handle Verification Timer
    setVerifyCountdown((prev) => {
      if (prev === null) return null;
      if (prev <= 1) {
        setError(""); // Clear only verification error
        return null;
      }
      return prev - 1;
    });

    // Handle Resend Timer
    setResendCountdown((prev) => {
      if (prev === null) return null;
      if (prev <= 1) {
        setResendError(""); // Clear only resend error
        return null;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);

  // Helper to format seconds into "1m 58s" or "58s"
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <form onSubmit={handleVerifyOtp} className="otp-form-wrapper">
      <div className="otp-input-wrapper">
        <input
          type="tel"
          className="otp-input-field"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (val.length <= 6) setOtp(val);
          }}
          maxLength={6}
          required
          disabled={loading}
        />
      </div>
      {(error || verifyCountdown !== null) && (
        <p className="error-text">
          {verifyCountdown !== null
            ? `You can try again in ${formatTime(verifyCountdown)}`
            : error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || otp.length !== 6 || verifyCountdown !== null}
        className="otp-submit-btn accent-gradient"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <p className="otp-resend-text">
        Didn’t get the code?{" "}
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendLoading || resendCountdown !== null}
          className="otp-resend-btn"
        >
          {resendLoading ? "Resending..." : "Resend"}
        </button>
        {resendSuccess && (
          <p className="success-text mt-1">{resendSuccess}</p>
        )}
        {resendError && (
          <p className="error-text mt-1">
            {resendCountdown !== null
              ? `Please wait ${formatTime(resendCountdown)} before trying again`
              : resendError}
          </p>
        )}
      </p>
    </form>
  );
}
