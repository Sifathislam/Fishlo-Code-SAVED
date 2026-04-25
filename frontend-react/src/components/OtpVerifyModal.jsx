import { useNavigate } from "react-router-dom";
import OtpVerifyRightSideForm from "./OtpVerifyRightSideForm";

export default function OtpVerifyModal({
  setOpenLogin,
  otpMessage,
  setOtpMessage,
  sessionId,
  setSessionId,
  phoneNumber,
}) {
  const navigate = useNavigate();
  const closeModal = () => {
    setOpenLogin(false);
  };
  return (
    <>
      {/* Modal */}
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
                  alt="Verify OTP Visual"
                  className="w-100 h-100 "
                  style={{ objectFit: "fill", height: "100%" }}
                />
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="btn-close position-absolute end-0 m-3"
                onClick={closeModal}
              ></button>

              {/* Right Side Form */}
              <div className="col-md-6 p-5 bg-white">
                <div className="text-center mb-4">
                  <img
                    src="/fishlo-logo.svg"
                    alt="Fishlo"
                    className="mx-auto mb-2"
                    style={{ height: "60px" }}
                  />
                  <h4 className="fw-semibold mb-2">Verify OTP</h4>
                  <p className="text-muted small">
                    Enter the 6-digit code sent to your phone
                  </p>
                  {otpMessage && (
                    <p className="success-text mt-1">{otpMessage}</p>
                  )}
                </div>

                {/* OTP Form */}
                <OtpVerifyRightSideForm
                  setOpenLogin={setOpenLogin}
                  otpMessage={otpMessage}
                  setOtpMessage={setOtpMessage}
                  sessionId={sessionId}
                  setSessionId={setSessionId}
                  phoneNumber={phoneNumber}
                />

                <hr className="my-4" />
                <p className="text-center text-muted small">
                  By continuing, you agree to our{" "}
                  <a
                    onClick={(e) => {
                      e.preventDefault(),
                        navigate("/terms-and-conditions"),
                        closeModal();
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
                        closeModal();
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
    </>
  );
}
