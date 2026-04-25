// hooks/useDebouncedValue.js
import { useEffect, useState } from "react";

export default function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // set timeout to update debounced value
    const id = setTimeout(() => setDebounced(value), delay);

    // cleanup: clear timer on value/delay change or unmount
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
