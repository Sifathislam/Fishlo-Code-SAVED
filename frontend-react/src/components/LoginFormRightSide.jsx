import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../shared/api";

export default function LoginFormRightSide({
  setSessionId,
  setOtpMessage,
  setPhoneNumber,
  setVerifyCountdown,
  verifyCountdown,
}) {
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
  if (verifyCountdown === null) return;

  if (verifyCountdown <= 0) {
    setVerifyCountdown(null);
    setError(""); // optional
    return;
  }

  const interval = setInterval(() => {
    setVerifyCountdown((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(interval);
}, [verifyCountdown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        `${import.meta.env.VITE_SERVER_BASE_URL}/send-otp/`,
        {
          phone_number: `+91${phone}`,
        }
      );
      setOtpMessage(response.data.message);
      setSessionId(response.data.session_id);
      setPhoneNumber(phone);
      // console.log("OTP sent:", response.data);
    } catch (err) {
      console.error(err);
      const data = err.response?.data;

      if (data) {
        if (data.retry_after_seconds) {
          setVerifyCountdown(data.retry_after_seconds);
        }
        setError(data.error || data?.detail || data.phone_number[0]);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
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

  return (
    <form onSubmit={handleLogin} className="login-form">
      <div className="phone-input-wrapper">
        <span className="phone-prefix">+91</span>
        <input
          type="tel"
          className="phone-input"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (val.length <= 10) setPhone(val);
          }}
          maxLength={10}
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
        className="submit-btn accent-gradient"
        disabled={loading || phone.length !== 10 || verifyCountdown !== null}
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>
    </form>
  );
}
