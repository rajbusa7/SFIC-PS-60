"use client";

import React, { useEffect, useState } from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "./Card";

export interface StatTileProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  change?: {
    value: number | string;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
  icon?: LucideIcon;
  variant?: "saffron" | "mint" | "coral" | "indigo" | "neutral";
  sparklineData?: number[];
  description?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  prefix = "",
  suffix = "",
  change,
  icon: Icon,
  variant = "saffron",
  sparklineData,
  description,
  className = "",
}: StatTileProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(
    typeof value === "number" ? 0 : value
  );

  // Animated count up for numerical values
  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const startVal = 0;
    const endVal = value;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  const variantStyles = {
    saffron: {
      glow: "border-amber-500/30 hover:border-amber-500/50 shadow-bridge-saffron/10",
      iconBg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      accent: "text-amber-500",
      stroke: "#FF8A3D",
    },
    mint: {
      glow: "border-emerald-500/30 hover:border-emerald-500/50 shadow-bridge-mint/10",
      iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      accent: "text-emerald-400",
      stroke: "#3DDBA9",
    },
    coral: {
      glow: "border-rose-500/30 hover:border-rose-500/50 shadow-bridge-coral/10",
      iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
      accent: "text-rose-400",
      stroke: "#FF5C6C",
    },
    indigo: {
      glow: "border-indigo-500/30 hover:border-indigo-500/50",
      iconBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
      accent: "text-indigo-400",
      stroke: "#6366F1",
    },
    neutral: {
      glow: "border-slate-800 hover:border-slate-700",
      iconBg: "bg-slate-800/60 text-slate-400 border border-slate-700/60",
      accent: "text-white",
      stroke: "#94A3B8",
    },
  }[variant];

  // SVG mini sparkline path generator
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 80;
    const height = 28;

    const points = sparklineData.map((d, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((d - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return (
      <svg
        width={width}
        height={height}
        className="overflow-visible opacity-80"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={variantStyles.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
      </svg>
    );
  };

  return (
    <Card
      variant="glass"
      className={`relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 ${variantStyles.glow} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            {prefix && (
              <span className="text-lg font-bold text-slate-400">{prefix}</span>
            )}
            <span className="font-heading text-3xl font-extrabold tracking-tight text-white">
              {displayValue}
            </span>
            {suffix && (
              <span className={`text-sm font-bold ${variantStyles.accent}`}>
                {suffix}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${variantStyles.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(change || sparklineData || description) && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
          {change ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  change.trend === "up"
                    ? "text-emerald-400"
                    : change.trend === "down"
                    ? "text-rose-400"
                    : "text-slate-400"
                }`}
              >
                {change.trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
                {change.trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
                {change.trend === "neutral" && <Minus className="h-3.5 w-3.5" />}
                {change.value}
              </span>
              {change.label && (
                <span className="text-slate-400">{change.label}</span>
              )}
            </div>
          ) : description ? (
            <span className="text-slate-400">{description}</span>
          ) : (
            <div />
          )}

          {renderSparkline()}
        </div>
      )}
    </Card>
  );
}
