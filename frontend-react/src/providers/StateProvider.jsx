import { useState } from "react";
import { StateContext } from "../context";

export default function StateProvider({ children }) {
  const [openLogin, setOpenLogin] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <StateContext.Provider
      value={{ openLogin, setOpenLogin, cartOpen, setCartOpen }}
    >
      {children}
    </StateContext.Provider>
  );
}
