/* eslint-disable react-refresh/only-export-components -- hooks + provider in same file by design */
import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

export type ToastLink = { url: string; label: string };

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
  link?: ToastLink;
};

type ToastContextValue = {
  toasts: ToastItem[];
  addToast: (message: string, variant?: ToastVariant, link?: ToastLink) => string;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;
function genId() {
  return `toast-${Date.now()}-${++nextId}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info", link?: ToastLink) => {
    const id = genId();
    setToasts((prev) => [...prev, { id, message, variant, createdAt: Date.now(), link }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
