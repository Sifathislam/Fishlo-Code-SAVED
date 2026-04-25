import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../shared/api";
import useStateHooks from "../../shared/hooks/useStateHooks";
import PhoneVerifyOtp from "./PhoneVerifyOtp";

// --- CAROUSEL LOGIC ---
const slides = [
  {
    icon: "bi-star-fill",
    title: "Premium Quality",
    desc: "Hand-picked fish, cleaned & cut to perfection.",
  },
  {
    icon: "bi-lightning-charge-fill",
    title: "Superfast Delivery",
    desc: "Fresh from the sea to your door in 45 mins.",
  },
];

const PhoneLogin = () => {
  const [step, setStep] = useState("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(5);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [verifyCountdown, setVerifyCountdown] = useState(null);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use the hook (mocked or real)
  const { openLogin, setOpenLogin } = useStateHooks();

  const otpRefs = useRef([]);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds
    return () => clearInterval(slideInterval);
  }, [slides.length]);

  useEffect(() => {
    if (verifyCountdown === null) return;

    if (verifyCountdown <= 0) {
      setVerifyCountdown(null);
      setError("")
      return;
    }

    const interval = setInterval(() => {
      setVerifyCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [verifyCountdown]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) setPhone(val);
  };

  const handleGetOtp = async () => {
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
      setSessionId(response.data.session_id);
      setStep("OTP");
      setTimer(45);
      setCanResend(false);
      setOtp(new Array(6).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);

      // console.log("OTP sent:", response.data);
    } catch (err) {
      const data = err.response?.data;

      if (data) {
        if (data.retry_after_seconds) {
          setVerifyCountdown(data.retry_after_seconds);
        }
        setError(data.error || data?.detail || data.phone_number[0]);
        // setTimeout(() => setError(null), 9000);
      } else {
        setError("Something went wrong. Please try again.");
        // setTimeout(() => setError(null), 9000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhone = () => {
    setStep("PHONE");
  };

  // If closed, don't render
  if (!openLogin) return null;

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
    <>
      {/* Optional: Dim Backdrop */}
      <div
        className="login-backdrop mobile-login"
        onClick={() => setOpenLogin(false)}
      ></div>

      {/* The Sheet */}
      <div className="login-sheet-overlay mobile-login">
        {/* --- FIXED: Close Button Floating Above --- */}
        <button
          className="close-btn-floating"
          onClick={() => setOpenLogin(false)}
        >
          <X size={24} />
        </button>

        <div className="drag-indicator"></div>
        <div className="sheet-padding">
          {/* STEP 1: PHONE */}
          {step === "PHONE" && (
            <div className="slide-up-inner">
              {/* --- FIXED: React Controlled Carousel --- */}
              <div className="glowing-banner">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`banner-content ${index === currentSlide ? "slide-active" : "slide-hidden"
                      }`}
                  >
                    <div className="banner-icon-box">
                      {/* Bootstrap Icons or simple fallback */}
                      <i className={`bi ${slide.icon}`}></i>
                    </div>
                    <div className="banner-text">
                      <h5>{slide.title}</h5>
                      <p>{slide.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="header-title">Welcome Back!</h2>
              <p className="header-sub">
                Enter your mobile number to get started.
              </p>

              <div className="custom-input-group">
                <span className="c-prefix">+91</span>
                <input
                  type="tel"
                  className="c-input"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={handlePhoneChange}
                />
              </div>
              {(error || verifyCountdown !== null) && (
                <div className="msg-box  msg-error mt-2">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {verifyCountdown !== null
                    ? `You can try again in ${formatTime(verifyCountdown)}`
                    : error}
                </div>
              )}

              <button
                className="btn-fishlo"
                disabled={
                  phone.length < 10 || loading || verifyCountdown !== null
                }
                onClick={handleGetOtp}
              >
                {loading ? "Please wait..." : "Get Verification Code"}
              </button>

              <p
                className="text-center mt-3"
                style={{ fontSize: "11px", color: "#999" }}
              >
                By continuing, you accept our {""}
                <a href="#" className="text-link">
                  Terms
                </a>
                &
                <a href="#" className="text-link">
                  Privacy
                </a>
              </p>
            </div>
          )}
          {step === "OTP" && (
            <PhoneVerifyOtp
              handleEditPhone={handleEditPhone}
              otpRefs={otpRefs}
              phone={phone}
              otp={otp}
              setOtp={setOtp}
              timer={timer}
              setTimer={setTimer}
              setCanResend={setCanResend}
              step={step}
              canResend={canResend}
              setSessionId={setSessionId}
              sessionId={sessionId}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default PhoneLogin;
