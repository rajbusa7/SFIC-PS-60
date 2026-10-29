import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "needsSupport"
  | "developing"
  | "mastered"
  | "high"
  | "medium"
  | "low"
  | "suggested"
  | "approved"
  | "inProgress"
  | "completed"
  | "default"
  | "outline"
  | "saffron"
  | "mint"
  | "coral"
  | "indigo"
  | "amber";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  pulse = false,
  className,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    needsSupport:
      "bg-[#FFEAEB] dark:bg-[#FF5C6C]/15 text-[#E02438] dark:text-[#FF7D8A] border-[#FF5C6C]/30 font-semibold",
    developing:
      "bg-[#FEF3C7] dark:bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FCD34D] border-[#F59E0B]/30 font-medium",
    mastered:
      "bg-[#E6FAF3] dark:bg-[#3DDBA9]/15 text-[#0A7353] dark:text-[#6EE7B7] border-[#3DDBA9]/35 font-semibold",
    high: "bg-[#FF5C6C]/15 text-[#D91B32] dark:text-[#FF808E] border-[#FF5C6C]/40 font-bold",
    medium:
      "bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24] border-[#F59E0B]/40 font-semibold",
    low: "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium",
    suggested:
      "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    approved:
      "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900",
    inProgress:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    completed:
      "bg-[#E6FAF3] dark:bg-[#3DDBA9]/15 text-[#0A7353] dark:text-[#6EE7B7] border-[#3DDBA9]/35 font-semibold",
    default:
      "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    outline:
      "bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    saffron:
      "bg-[#FFF0E6] dark:bg-[#FF8A3D]/20 text-[#D96316] dark:text-[#FFAE7A] border-[#FF8A3D]/40 font-bold",
    mint:
      "bg-[#E6FAF3] dark:bg-[#3DDBA9]/15 text-[#0A7353] dark:text-[#6EE7B7] border-[#3DDBA9]/35 font-semibold",
    coral:
      "bg-[#FFEAEB] dark:bg-[#FF5C6C]/15 text-[#E02438] dark:text-[#FF7D8A] border-[#FF5C6C]/30 font-semibold",
    indigo:
      "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold",
    amber:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-semibold",
  };

  const dotColors: Record<BadgeVariant, string> = {
    needsSupport: "bg-[#FF5C6C]",
    developing: "bg-[#F59E0B]",
    mastered: "bg-[#3DDBA9]",
    high: "bg-[#FF5C6C]",
    medium: "bg-[#F59E0B]",
    low: "bg-slate-400",
    suggested: "bg-blue-400",
    approved: "bg-purple-400",
    inProgress: "bg-amber-400",
    completed: "bg-[#3DDBA9]",
    default: "bg-slate-400",
    outline: "bg-slate-400",
    saffron: "bg-[#FF8A3D]",
    mint: "bg-[#3DDBA9]",
    coral: "bg-[#FF5C6C]",
    indigo: "bg-indigo-400",
    amber: "bg-amber-400",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2.5 py-0.5 gap-1.5",
    md: "text-xs px-3 py-1 gap-2",
  };

  const showDot = dot || pulse;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-2xs transition-colors",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColors[variant]
            )}
          />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
