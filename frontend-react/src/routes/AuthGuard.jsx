import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/**
 * A unified Authentication Guard to handle all route-level protection.
 * 
 * @param {Array} allowedRoles - Roles permitted to access these routes. If empty, all authenticated users are allowed.
 * @param {Array} excludeRoles - Authenticated roles that should be REDIRECTED AWAY (e.g., managers shouldn't see home).
 * @param {string} loginPath - Custom login path for redirecting unauthenticated users.
 */
const AuthGuard = ({
  allowedRoles = [],
  excludeRoles = [],
  loginPath = "/login",
  requireAuth = true
}) => {
  const { auth } = useAuth();
  const location = useLocation();

  const isAuthenticated = !!(auth?.authToken || auth?.refreshToken);
  const userRole = auth?.role || "CUSTOMER";

  // 1. If not authenticated and auth is required
  if (!isAuthenticated && requireAuth) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. If authenticated and role is explicitly EXCLUDED
  if (isAuthenticated && excludeRoles.length > 0 && excludeRoles.includes(userRole)) {
    if (userRole === "STORE_MANAGER") return <Navigate to="/store" replace />;
    if (userRole === "DELIVERY_PARTNER") return <Navigate to="/delivery" replace />;
    return <Navigate to="/" replace />; // Default fallback
  }

  // 3. If roles are RESTRICTED and user doesn't have the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect unprivileged authenticated users to their own dashboard or login
    if (userRole === "STORE_MANAGER") return <Navigate to="/store" replace />;
    if (userRole === "DELIVERY_PARTNER") return <Navigate to="/delivery" replace />;
    return <Navigate to={loginPath} replace />;
  }

  // 4. Access granted
  return <Outlet />;
};

export default AuthGuard;
