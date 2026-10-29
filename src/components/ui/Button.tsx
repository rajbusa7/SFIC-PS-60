"use client";

import React from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "mint" | "coral" | "saffron" | "indigo";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-full select-none transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeClasses = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-7 py-3 gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-[#FF8A3D] to-[#FF6E2E] text-slate-950 font-bold shadow-md shadow-[#FF8A3D]/25 hover:shadow-lg hover:shadow-[#FF8A3D]/40 hover:-translate-y-0.5 border border-white/20 focus-visible:ring-[#FF8A3D]",
    saffron:
      "bg-gradient-to-r from-[#FF8A3D] to-[#FF6E2E] text-slate-950 font-bold shadow-md shadow-[#FF8A3D]/25 hover:shadow-lg hover:shadow-[#FF8A3D]/40 hover:-translate-y-0.5 border border-white/20 focus-visible:ring-[#FF8A3D]",
    secondary:
      "bg-[#2B2A6B] text-white hover:bg-[#383785] shadow-md shadow-[#2B2A6B]/20 hover:-translate-y-0.5 border border-indigo-400/20 focus-visible:ring-[#2B2A6B]",
    indigo:
      "bg-[#2B2A6B] text-white hover:bg-[#383785] shadow-md shadow-[#2B2A6B]/20 hover:-translate-y-0.5 border border-indigo-400/20 focus-visible:ring-[#2B2A6B]",
    outline:
      "border border-slate-300 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-indigo-950/40 backdrop-blur-sm focus-visible:ring-slate-400",
    ghost:
      "text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-indigo-900/30 focus-visible:ring-slate-400",
    mint:
      "bg-[#3DDBA9] text-[#0A3D2D] hover:bg-[#48E5B3] font-bold shadow-md shadow-[#3DDBA9]/25 hover:-translate-y-0.5 border border-white/30 focus-visible:ring-[#3DDBA9]",
    coral:
      "bg-[#FF5C6C] text-white hover:bg-[#FF6E7C] shadow-md shadow-[#FF5C6C]/25 hover:-translate-y-0.5 border border-white/20 focus-visible:ring-[#FF5C6C]",
  };

  return (
    <button
      className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
