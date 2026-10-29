"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "circle" | "text";
  height?: number | string;
  width?: number | string;
}

export function Skeleton({
  variant = "rectangle",
  height,
  width,
  className,
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rectangle: "rounded-xl",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full",
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-slate-800/60 relative overflow-hidden",
        variantStyles,
        className
      )}
      style={{
        height: height !== undefined ? height : undefined,
        width: width !== undefined ? width : undefined,
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3 h-4" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
      <Skeleton variant="text" className="w-2/3 h-8" />
      <div className="space-y-2 pt-2">
        <Skeleton variant="text" className="w-full h-3" />
        <Skeleton variant="text" className="w-4/5 h-3" />
      </div>
    </div>
  );
}
