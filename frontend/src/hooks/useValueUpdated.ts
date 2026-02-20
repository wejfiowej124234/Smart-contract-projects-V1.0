import { useEffect, useRef, useState } from "react";

const VALUE_UPDATED_DURATION_MS = 600;

/**
 * Returns a class name "value-updated" for a short period after the value changes,
 * so CSS can run a subtle highlight animation (Product-Finish).
 * Respects prefers-reduced-motion by not applying the class when reduced.
 */
export function useValueUpdated(value: string | number | undefined): string {
  const prev = useRef(value);
  const [className, setClassName] = useState("");
  const reducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reducedMotion.current = true;
    }
  }, []);

  useEffect(() => {
    if (reducedMotion.current) return;
    const same = prev.current === value;
    const isFirstMount = prev.current === undefined && value !== undefined;
    prev.current = value;
    if (same || isFirstMount) return;
    queueMicrotask(() => setClassName("value-updated"));
    const t = window.setTimeout(() => setClassName(""), VALUE_UPDATED_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [value]);

  return className;
}
