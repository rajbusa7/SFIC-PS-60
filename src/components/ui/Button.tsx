"use client";

import React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "mint" | "coral" | "saffron" | "indigo";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  target?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  href,
  target,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex flex-row flex-nowrap items-center justify-center font-semibold rounded-full select-none whitespace-nowrap transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8D4E10] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6E9] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeClasses = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-7 py-3 gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-[#F2CAB3] hover:bg-white text-[#49352F] font-bold border border-[#49352F]/16 shadow-[0_4px_14px_rgba(73,53,47,0.08)] hover:shadow-[0_8px_20px_rgba(73,53,47,0.14)] hover:-translate-y-0.5",
    saffron:
      "bg-[#F2CAB3] hover:bg-white text-[#49352F] font-bold border border-[#49352F]/16 shadow-[0_4px_14px_rgba(73,53,47,0.08)] hover:shadow-[0_8px_20px_rgba(73,53,47,0.14)] hover:-translate-y-0.5",
    secondary:
      "bg-white hover:bg-[#F2CAB3] text-[#49352F] font-semibold border border-[#49352F]/14 shadow-xs hover:-translate-y-0.5",
    indigo:
      "bg-[#F2DCB5]/80 hover:bg-[#F2CAB3] text-[#49352F] font-semibold border border-[#49352F]/14 shadow-xs hover:-translate-y-0.5",
    outline:
      "border border-[#49352F]/18 bg-white/70 hover:bg-[#F2CAB3]/40 text-[#49352F] font-semibold backdrop-blur-xs",
    ghost:
      "text-[#49352F] hover:bg-[#49352F]/8 font-medium",
    mint:
      "bg-[#EAF4EE] text-[#2E7D5E] hover:bg-[#2E7D5E] hover:text-white font-bold border border-[#2E7D5E]/25 shadow-xs hover:-translate-y-0.5 focus-visible:ring-[#2E7D5E]",
    coral:
      "bg-[#FBECE9] text-[#A93327] hover:bg-[#A93327] hover:text-white font-bold border border-[#A93327]/25 shadow-xs hover:-translate-y-0.5 focus-visible:ring-[#A93327]",
  };

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 self-center" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex items-center justify-center self-center" aria-hidden="true">{leftIcon}</span>
      )}
      <span className="inline-flex flex-row flex-nowrap items-center justify-center gap-1.5 leading-none self-center whitespace-nowrap">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0 inline-flex items-center justify-center self-center" aria-hidden="true">{rightIcon}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
        {...(props as any)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? "true" : undefined}
      {...props}
    >
      {content}
    </button>
  );
}
