"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Sun, Moon, Monitor, Check } from "lucide-react";

interface ThemeToggleProps {
  variant?: "button" | "dropdown" | "segmented";
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  variant = "button",
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: t.theme?.light || "Light", icon: Sun },
    { mode: "dark", label: t.theme?.dark || "Dark", icon: Moon },
    { mode: "system", label: t.theme?.system || "System", icon: Monitor },
  ];

  // Segmented Pill Variant (ideal for Settings page or Sidebar)
  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 p-1 shadow-2xs ${className}`}
        role="group"
        aria-label={t.theme?.theme || "Theme"}
      >
        {options.map(({ mode, label, icon: Icon }) => {
          const isActive = mounted ? theme === mode : mode === "system";
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown Popover Variant
  if (variant === "dropdown") {
    const CurrentIcon =
      !mounted || resolvedTheme === "dark" ? Moon : Sun;

    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={t.theme?.theme || "Theme Selector"}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <CurrentIcon className="w-4 h-4 text-amber-500 dark:text-cyan-400 transition-transform duration-200" />
          {showLabel && (
            <span className="capitalize hidden sm:inline">
              {mounted ? t.theme?.[theme] || theme : "Theme"}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-700/50 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
              {t.theme?.theme || "Theme Mode"}
            </div>
            {options.map(({ mode, label, icon: Icon }) => {
              const isActive = mounted && theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setTheme(mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{label}</span>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default Quick 1-Click Toggle Button
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? t.theme?.switchToLight || "Switch to light theme"
          : t.theme?.switchToDark || "Switch to dark theme"
      }
      title={
        isDark
          ? t.theme?.switchToLight || "Switch to light theme"
          : t.theme?.switchToDark || "Switch to dark theme"
      }
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-2xs group cursor-pointer ${className}`}
    >
      {/* Icon with smooth rotation animation */}
      <span className="relative flex items-center justify-center w-4 h-4">
        <Sun
          className={`w-4 h-4 text-amber-500 transition-all duration-300 absolute ${
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 rotate-90 opacity-0"
          }`}
        />
        <Moon
          className={`w-4 h-4 text-indigo-600 dark:text-slate-200 transition-all duration-300 absolute ${
            isDark
              ? "scale-0 -rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        />
      </span>

      {showLabel && (
        <span className="ml-2 text-xs font-semibold capitalize hidden sm:inline">
          {isDark ? t.theme?.light || "Light" : t.theme?.dark || "Dark"}
        </span>
      )}
    </button>
  );
}
