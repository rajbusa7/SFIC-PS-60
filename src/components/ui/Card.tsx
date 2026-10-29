import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "interactive";
  glow?: boolean;
}

export function Card({
  variant = "glass",
  glow = false,
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    glass:
      "bg-white/85 dark:bg-[#14123D]/75 backdrop-blur-md border border-slate-200/70 dark:border-indigo-500/20 shadow-lg shadow-indigo-950/5 dark:shadow-black/30",
    solid:
      "bg-white dark:bg-[#14123D] border border-slate-200 dark:border-indigo-900/50 shadow-md",
    interactive:
      "bg-white/90 dark:bg-[#14123D]/80 backdrop-blur-md border border-slate-200/80 dark:border-indigo-500/20 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-[#FF8A3D]/40 transition-all duration-200 cursor-pointer",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-5 text-slate-900 dark:text-slate-100",
        variantStyles[variant],
        glow && "ring-1 ring-[#FF8A3D]/30 shadow-lg shadow-[#FF8A3D]/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-slate-100/80 dark:border-indigo-500/15 pb-4 mb-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight font-heading",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-slate-500 dark:text-slate-400 mt-0.5", className)}
      {...props}
    >
      {children}
    </p>
  );
}
