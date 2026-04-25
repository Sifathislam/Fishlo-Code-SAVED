import { useContext } from "react";
import { StateContext } from "../../context";

export default function useStateHooks() {
  return useContext(StateContext);
}
