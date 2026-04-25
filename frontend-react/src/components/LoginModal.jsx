import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginFormRightSide from "./LoginFormRightSide";
import OtpVerifyModal from "./OtpVerifyModal";

export default function LoginModal({ setOpenLogin }) {
  const [otpMessage, setOtpMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [verifyCountdown, setVerifyCountdown] = useState(null);
  const navigate = useNavigate();


  return (
    <>
      {sessionId ? (
        <OtpVerifyModal
          sessionId={sessionId}
          setSessionId={setSessionId}
          otpMessage={otpMessage}
          setOtpMessage={setOtpMessage}
          setOpenLogin={setOpenLogin}
          phoneNumber={phoneNumber}
        />
      ) : (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 overflow-hidden shadow-lg">
              <div className="row g-0">
                {/* Left Side Image */}
                <div className="col-md-6 d-none d-md-block">
                  <img
                    src="/Image/login-modal2.webp"
                    alt="Login Visual"
                    className="w-100 h-100 object-fit-cover"
                    style={{ objectFit: "cover", height: "100%" }}
                  />
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  className="btn-close position-absolute end-0 m-3"
                  onClick={() => setOpenLogin(false)}
                ></button>

                {/* Right Side Form */}
                <div className="col-md-6 p-5 bg-white">
                  <div className="text-center mb-4">
                    <img
                      src="/fishlo-logo.svg"
                      alt="BoroBazar"
                      className="mx-auto mb-2"
                      style={{ height: "60px" }}
                    />
                    <h4 className="fw-semibold mb-2">Welcome Back!</h4>
                    <p className="text-muted small">
                      Sign in or create an account with your phone number
                    </p>
                  </div>

                  {/* Simplified Login Form */}

                  <LoginFormRightSide
                    setOtpMessage={setOtpMessage}
                    setSessionId={setSessionId}
                    setPhoneNumber={setPhoneNumber}
                    setVerifyCountdown={setVerifyCountdown}
                    verifyCountdown={verifyCountdown}
                  />

                  <hr className="my-4" />
                  <p className="text-center text-muted small">
                    By continuing, you agree to our{" "}
                    <a
                      onClick={(e) => {
                        e.preventDefault(),
                          navigate("/terms-and-conditions"),
                          setOpenLogin(false);
                      }}
                      href=""
                      className="text-success text-decoration-none"
                    >
                      Terms & Conditions{" "}
                    </a>
                    and{" "}
                    <a
                      onClick={(e) => {
                        e.preventDefault(),
                          navigate("/privacy-policy"),
                          setOpenLogin(false);
                      }}
                      href=""
                      className="text-success text-decoration-none"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
