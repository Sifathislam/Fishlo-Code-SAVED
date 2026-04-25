import { useEffect, useState } from "react";
import { api } from "../../shared/api";
import { useMergeAddress } from "../../features/useAddress";
import { useMergeCart } from "../../features/useCart";
import useAuth from "../../hooks/useAuth";
import useStateHooks from "../../shared/hooks/useStateHooks";

export default function PhoneVerifyOtp({
  handleEditPhone,
  otpRefs,
  phone,
  otp,
  setOtp,
  timer,
  setTimer,
  setCanResend,
  step,
  canResend,
  setSessionId,
  sessionId,
}) {
  const [message, setMessage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyCountdown, setVerifyCountdown] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(null);
  const [resendError, setResendError] = useState("");
  const [verifyOtpError, setVerifyOtpError] = useState("");
  const localCartId = localStorage.getItem("cart_id");
  const { setAuth } = useAuth();
  const { setOpenLogin } = useStateHooks();
  const { mutate: mergeCart } = useMergeCart();
  const { mutate: mergeAddress } = useMergeAddress();

  useEffect(() => {
    const interval = setInterval(() => {
      if (step === "OTP" && timer > 0) {
        setTimer((prev) => prev - 1);
      } else if (timer === 0 && !resendCountdown) {
        setCanResend(true);
      }
      setVerifyCountdown((prev) =>
        prev !== null && prev > 0 ? prev - 1 : null
      );
      setResendCountdown((prev) =>
        prev !== null && prev > 0 ? prev - 1 : null
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer, resendCountdown]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    setMessage(null);
    if (element.value && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    setIsVerifying(true);

    try {
      const response = await api.post("verify-otp/", {
        session_id: sessionId,
        otp: code,
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
      if (localCartId) {
        mergeCart(localCartId);
      }
      mergeAddress();

      // Close modal
      setOpenLogin(false);
    } catch (err) {
      // console.error("OTP Verification Error:", err.response?.data);
      const data = err.response?.data;

      // Server error message from backend
      if (data) {
        if (data.retry_after_seconds) {
          setVerifyCountdown(data.retry_after_seconds);
        }
        setVerifyOtpError(data?.error || data?.detail);
        setTimeout(() => setVerifyOtpError(null), 8000);
      } else {
        setVerifyOtpError("Unable to verify OTP. Please try again.");
        setTimeout(() => setVerifyOtpError(null), 8000);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendError("");
    setResendLoading(true);

    try {
      const response = await api.post(
        `${import.meta.env.VITE_SERVER_BASE_URL}/send-otp/`,
        {
          phone_number: `+91${phone}`,
        }
      );
      setSessionId(response.data.session_id);
      setTimer(45);
      setCanResend(false);
      setResendSuccess("A new verification code has been sent to your number.");
      setTimeout(() => setResendSuccess(null), 8000);
    } catch (err) {
      //   console.error(err);
      const data = err.response?.data;

      if (data) {
        if (data.retry_after_seconds) {
          setResendCountdown(data.retry_after_seconds);
          setCanResend(false);
        }
        setResendError(data.error || data?.detail || data.phone_number[0]);
        setTimeout(() => setResendError(null), 8000);
      } else {
        setResendError("Something went wrong. Please try again.");
        setTimeout(() => setResendError(null), 8000);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds <= 0) return "00:00";

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const isOtpComplete = otp.every((digit) => digit !== "");
  return (
    <div className="slide-up-inner">
      <h2 className="header-title">Enter OTP</h2>
      <p className="header-sub">
        Sent to{" "}
        <span style={{ color: "var(--fishlo-gray)", fontWeight: 700 }}>
          +91 {phone}
        </span>
        <span className="edit-link" onClick={handleEditPhone}>
          Edit
        </span>
      </p>

      <div className="otp-grid-6">
        {otp.map((data, index) => (
          <input
            key={index}
            type="tel"
            maxLength="1"
            className={`otp-box-6 ${
              message?.type === "error" ? "otp-error" : ""
            }`}
            value={data}
            ref={(el) => (otpRefs.current[index] = el)}
            onChange={(e) => handleOtpChange(e.target, index)}
            onKeyDown={(e) => handleOtpKeyDown(e, index)}
          />
        ))}
      </div>
      <div>
        {(verifyCountdown !== null || verifyOtpError) && (
          <div className="msg-box msg-error mt-2">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {verifyCountdown !== null
              ? `Try again in ${formatTime(verifyCountdown)}s`
              : verifyOtpError}
          </div>
        )}
      </div>

      <div
        className="text-center mb-4"
        style={{ fontSize: "13px", height: "24px" }}
      >
        {!canResend ? (
          <span>
            <span style={{ color: "var(--fishlo-text-sub)" }}>
              Resend code in{" "}
            </span>
            <span style={{ color: "var(--fishlo-red)", fontWeight: 600 }}>
              {resendCountdown !== null
                ? formatTime(resendCountdown)
                : `00:${timer < 10 ? `0${timer}` : timer}`}
            </span>
          </span>
        ) : (
          <span>
            <span style={{ color: "var(--fishlo-text-sub)" }}>
              Didn't receive code?
            </span>
            <p
              disabled={resendLoading}
              className="resend-action"
              onClick={handleResend}
            >
              {resendLoading ? "Resending..." : "Resend OTP"}
            </p>
          </span>
        )}
        {resendError && resendCountdown === null && (
          <div className="msg-box msg-error mb-2">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {resendError}
          </div>
        )}
        {resendSuccess && (
          <div className="msg-box  msg-success mb-2">
            <i className="bi bi-check-circle-fill me-2"></i>
            {resendSuccess}
          </div>
        )}
      </div>

      <button
        className="btn-fishlo"
        disabled={!isOtpComplete || isVerifying || verifyCountdown !== null}
        onClick={handleVerify}
      >
        {isVerifying ? "Verifying..." : "Verify & Login"}
      </button>
    </div>
  );
}
