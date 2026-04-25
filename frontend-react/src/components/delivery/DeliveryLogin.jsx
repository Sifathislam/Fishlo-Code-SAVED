import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api";
import useAuth from "../../hooks/useAuth";
import "../../styles/delivery.css";


export default function DeliveryLogin() {
  document.title = "Partner Login - Fishlo";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();

  useEffect(() => {
    // Redirect if already logged in based on role
    if (auth?.authToken) {
      if (auth?.role === "DELIVERY_PARTNER") {
        navigate("/delivery", { replace: true });
      } else if (auth?.role === "STORE_MANAGER") {
        navigate("/store", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [auth, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post(`delivery/login/`, {
        email,
        password,
      });

      if (response.status === 200) {
        const { tokens, role } = response.data;

        // Save to Cookies
        const commonCookieOptions = {
          path: "/",
          secure: true,
          sameSite: "Strict",
        };
        Cookies.set("__Host-auth", tokens.access, {
          ...commonCookieOptions,
          expires: 1 / 48,
        }); // 30 mins
        Cookies.set("__Host-refresh", tokens.refresh, {
          ...commonCookieOptions,
          expires: 7,
        }); // 7 days
        Cookies.set("__Host-role", role, {
          ...commonCookieOptions,
          expires: 7,
        });

        // Update Auth Context
        setAuth({
          authToken: tokens.access,
          refreshToken: tokens.refresh,
          role: role,
        });

        // Redirect based on role
        if (role === "DELIVERY_PARTNER") {
          navigate("/delivery");
        } else if (role === "STORE_MANAGER") {
          navigate("/store");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error("Delivery Login Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Invalid credentials or server error. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delivery-login-wrapper">
      <div className="delivery-login-logo">
        <h1>Fishlo Partner</h1>
      </div>

      <div className="delivery-login-header mb-4 text-center">
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#393f4a" }}>Partner Login</h2>
        <p className="text-muted">Deliver happiness, earn with Fishlo.</p>
      </div>

      {error && (
        <div className="alert alert-danger p-2 small mb-4 rounded-3">
          <i className="fa fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="delivery-input-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="partner@fishlo.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="delivery-input-group">
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="btn border-0 position-absolute end-0 top-50 translate-middle-y text-muted"
              style={{ zIndex: 10, background: "none" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="delivery-btn"
          disabled={loading}
          style={{
            backgroundColor: "var(--delivery-primary)",
            color: "white",
            fontSize: "1rem",
            fontWeight: "600",
            marginTop: "1rem"
          }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="small text-muted">
          Need help? <a href="mailto:support@fishlo.in" className="text-primary text-decoration-none">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
