"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Sun, Moon, Monitor, Check } from "lucide-react";

interface ThemeToggleProps {
  variant?: "button" | "dropdown" | "segmented" | "glass";
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
        className={`inline-flex items-center rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-[#FAF6E9] dark:bg-[#1E1916] p-1 shadow-2xs ${className}`}
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
                  ? "bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] shadow-xs border border-[#49352F]/10 dark:border-[#F2CAB3]/20 font-bold"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
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
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] px-2.5 py-1.5 text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] transition-colors shadow-2xs cursor-pointer"
        >
          <CurrentIcon className="w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3] transition-transform duration-200" />
          {showLabel && (
            <span className="capitalize hidden sm:inline">
              {mounted ? t.theme?.[theme] || theme : "Theme"}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-[#FAF6E9] dark:bg-[#26201C] p-1.5 shadow-xl ring-1 ring-[#49352F]/10 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7A6862] dark:text-[#FAF6E9]/60 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 mb-1">
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
                      ? "bg-[#F2CAB3]/40 dark:bg-[#F2CAB3]/25 text-[#49352F] dark:text-[#F4F1E1] font-bold"
                      : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:bg-white dark:hover:bg-[#1E1916] hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#7A6862] dark:text-[#FAF6E9]/70" />
                    <span>{label}</span>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />}
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
  const isGlass = variant === "glass";

  const buttonClasses = isGlass
    ? `relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md text-amber-300 hover:text-white hover:bg-white/10 hover:border-amber-500/40 transition-all shadow-inner group cursor-pointer ${className}`
    : `relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] transition-all shadow-2xs group cursor-pointer ${className}`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? t.theme?.switchToLight || "Active: Dark Mode (Click for Light Mode)"
          : t.theme?.switchToDark || "Active: Light Mode (Click for Dark Mode)"
      }
      title={
        isDark
          ? t.theme?.switchToLight || "Active: Dark Mode (Click for Light Mode)"
          : t.theme?.switchToDark || "Active: Light Mode (Click for Dark Mode)"
      }
      className={buttonClasses}
    >
      {/* Icon with smooth rotation animation */}
      <span className="relative flex items-center justify-center w-4 h-4">
        <Sun
          className={`w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3] transition-all duration-300 absolute ${
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 rotate-90 opacity-0 pointer-events-none"
          }`}
        />
        <Moon
          className={`w-4 h-4 text-[#49352F] dark:text-[#FAF6E9] transition-all duration-300 absolute ${
            isDark
              ? "scale-0 -rotate-90 opacity-0 pointer-events-none"
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
