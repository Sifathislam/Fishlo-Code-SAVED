import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api";
import useAuth from "../../hooks/useAuth";
import "../../styles/storeDashboard.css";
// import { api } from '../../shared/api'; // Assuming api instance is here, or use axios directly

export default function StoreLogin() {
  document.title = "Store Login - Fishlo";
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
      if (auth?.role === "STORE_MANAGER") {
        navigate("/store", { replace: true });
      } else if (auth?.role === "DELIVERY_PARTNER") {
        navigate("/delivery", { replace: true });
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
      // Use the base URL from your API config or env, defaulting here for safety
      const response = await api.post(`store/login/`, {
        email,
        password,
      });
      if (response.status === 200) {
        const { tokens, role } = response.data;

        // Save to Cookies (for API interceptors and persistence)
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

        // Clear legacy data if any
        localStorage.removeItem("user_profile");
        localStorage.removeItem("store_zone_id");

        // Redirect based on role
        if (role === "STORE_MANAGER") {
          navigate("/store");
        } else if (role === "DELIVERY_PARTNER") {
          navigate("/delivery");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      // Extract specific error message from backend
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
    <div className="sd-login-wrapper">
      <div className="sd-login-card">
        <div className="sd-login-header">
          <h1 className="sd-login-title">Store Login</h1>
          <p className="sd-login-subtitle">
            Manage your inventory and orders easily.
          </p>
        </div>

        {error && <div className="alert alert-danger p-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="sd-login-form-group">
            <label className="sd-login-label">Email Address</label>
            <div className="sd-login-input-wrapper">
              <i className="bi bi-envelope sd-login-icon"></i>
              <input
                type="email"
                className="sd-login-input"
                placeholder="name@fishlo.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="sd-login-form-group">
            <label className="sd-login-label">Password</label>
            <div className="sd-login-input-wrapper">
              <i className="bi bi-lock sd-login-icon"></i>
              <input
                type={showPassword ? "text" : "password"}
                className="sd-login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn border-0 position-absolute end-0 text-muted"
                style={{ zIndex: 10 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          <button type="submit" className="sd-login-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
