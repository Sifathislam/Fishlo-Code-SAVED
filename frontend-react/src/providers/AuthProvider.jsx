import Cookies from "js-cookie";
import { useState } from "react";
import { AuthContext } from "../context";

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    authToken: Cookies.get("__Host-auth"),
    refreshToken: Cookies.get("__Host-refresh"),
    role: Cookies.get("__Host-role"),
  });


  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
