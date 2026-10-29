"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (props: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-slate-900/95 border backdrop-blur-xl shadow-2xl transition-all duration-300 transform animate-in slide-in-from-bottom-5 ${
              toast.type === "success"
                ? "border-emerald-500/40 text-emerald-300"
                : toast.type === "error"
                ? "border-rose-500/40 text-rose-300"
                : toast.type === "warning"
                ? "border-amber-500/40 text-amber-300"
                : "border-sky-500/40 text-sky-300"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return safe fallback so components can call useToast even outside provider
    return {
      showToast: (props: Omit<ToastItem, "id">) => {
        console.log(`[Toast ${props.type}]: ${props.title}`);
      },
      dismissToast: () => {},
    };
  }
  return context;
}
