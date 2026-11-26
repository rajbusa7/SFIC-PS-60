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
      "bg-[#FBECE9] text-[#A93327] border border-[#A93327]/25 dark:bg-[#C54738]/20 dark:text-[#FA8C7C] dark:border-[#FA8C7C]/30 font-semibold",
    developing:
      "bg-[#FDF4E7] text-[#8D4E10] border border-[#8D4E10]/25 dark:bg-[#B26A1B]/20 dark:text-[#F2CAB3] dark:border-[#F2CAB3]/30 font-semibold",
    mastered:
      "bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/25 dark:bg-[#2E7D5E]/25 dark:text-[#4EE2A7] dark:border-[#4EE2A7]/30 font-semibold",
    high:
      "bg-[#FBECE9] text-[#A93327] border border-[#A93327]/30 dark:bg-[#C54738]/20 dark:text-[#FA8C7C] dark:border-[#FA8C7C]/30 font-bold",
    medium:
      "bg-[#FDF4E7] text-[#8D4E10] border border-[#8D4E10]/30 dark:bg-[#B26A1B]/20 dark:text-[#F2CAB3] dark:border-[#F2CAB3]/30 font-semibold",
    low:
      "bg-[#FAF6E9] text-[#49352F] border border-[#49352F]/12 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:border-[#F2CAB3]/20 font-medium",
    suggested:
      "bg-[#FAF6E9] text-[#49352F] border border-[#49352F]/15 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:border-[#F2CAB3]/20 font-medium",
    approved:
      "bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/25 dark:bg-[#2E7D5E]/25 dark:text-[#4EE2A7] dark:border-[#4EE2A7]/30 font-semibold",
    inProgress:
      "bg-[#FDF4E7] text-[#8D4E10] border border-[#8D4E10]/25 dark:bg-[#B26A1B]/20 dark:text-[#F2CAB3] dark:border-[#F2CAB3]/30 font-semibold",
    completed:
      "bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/25 dark:bg-[#2E7D5E]/25 dark:text-[#4EE2A7] dark:border-[#4EE2A7]/30 font-semibold",
    default:
      "bg-[#FAF6E9] text-[#49352F] border border-[#49352F]/14 dark:bg-[#2E2520] dark:text-[#F4F1E1] dark:border-[#F2CAB3]/20 font-medium",
    outline:
      "bg-transparent text-[#49352F] border border-[#49352F]/20 dark:text-[#F4F1E1] dark:border-[#F2CAB3]/30 font-medium",
    saffron:
      "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/16 dark:bg-[#F2CAB3]/25 dark:text-[#F2CAB3] dark:border-[#F2CAB3]/35 font-bold",
    mint:
      "bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/25 dark:bg-[#2E7D5E]/25 dark:text-[#4EE2A7] dark:border-[#4EE2A7]/30 font-semibold",
    coral:
      "bg-[#FBECE9] text-[#A93327] border border-[#A93327]/25 dark:bg-[#C54738]/20 dark:text-[#FA8C7C] dark:border-[#FA8C7C]/30 font-semibold",
    indigo:
      "bg-[#F2DCB5]/80 text-[#49352F] border border-[#49352F]/14 dark:bg-[#F2CAB3]/20 dark:text-[#F4F1E1] dark:border-[#F2CAB3]/30 font-semibold",
    amber:
      "bg-[#FDF4E7] text-[#8D4E10] border border-[#8D4E10]/25 dark:bg-[#B26A1B]/20 dark:text-[#F2CAB3] dark:border-[#F2CAB3]/30 font-semibold",
  };

  const dotColors: Record<BadgeVariant, string> = {
    needsSupport: "bg-[#A93327] dark:bg-[#FA8C7C]",
    developing: "bg-[#8D4E10] dark:bg-[#F2CAB3]",
    mastered: "bg-[#2E7D5E] dark:bg-[#4EE2A7]",
    high: "bg-[#A93327] dark:bg-[#FA8C7C]",
    medium: "bg-[#8D4E10] dark:bg-[#F2CAB3]",
    low: "bg-[#7A6862] dark:bg-[#C2B3AC]",
    suggested: "bg-[#49352F] dark:bg-[#F4F1E1]",
    approved: "bg-[#2E7D5E] dark:bg-[#4EE2A7]",
    inProgress: "bg-[#8D4E10] dark:bg-[#F2CAB3]",
    completed: "bg-[#2E7D5E] dark:bg-[#4EE2A7]",
    default: "bg-[#49352F] dark:bg-[#F4F1E1]",
    outline: "bg-[#49352F] dark:bg-[#F4F1E1]",
    saffron: "bg-[#8D4E10] dark:bg-[#F2CAB3]",
    mint: "bg-[#2E7D5E] dark:bg-[#4EE2A7]",
    coral: "bg-[#A93327] dark:bg-[#FA8C7C]",
    indigo: "bg-[#B8673E] dark:bg-[#F2CAB3]",
    amber: "bg-[#8D4E10] dark:bg-[#F2CAB3]",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2.5 py-1 gap-1.5 min-h-[22px]",
    md: "text-xs px-3.5 py-1.5 gap-2 min-h-[26px]",
  };

  const showDot = dot || pulse;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border shadow-2xs leading-none shrink-0 whitespace-nowrap align-middle select-none transition-colors",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center self-center" aria-hidden="true">
          {pulse && (
            <span
              className={cn(
                "animate-pulse motion-reduce:animate-none absolute inline-flex h-2.5 w-2.5 rounded-full opacity-40",
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5 shrink-0",
              dotColors[variant]
            )}
          />
        </span>
      )}
      <span className="inline-flex items-center justify-center gap-1.5 leading-none shrink-0 self-center">
        {children}
      </span>
    </span>
  );
}
