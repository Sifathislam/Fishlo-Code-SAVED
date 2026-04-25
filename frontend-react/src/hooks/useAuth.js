import { useContext } from "react";
import { AuthContext } from "../context";

export default function useAuth() {
  //   const { auth } = useContext(AuthContext);

  //   useDebugValue(auth, (auth) =>
  //     auth?.user ? "User Logged in" : "Uer Logged out"
  //   );
  return useContext(AuthContext);
}
