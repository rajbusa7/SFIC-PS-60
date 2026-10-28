"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    try {
      const saved = (localStorage.getItem("studysaathi_theme") || localStorage.getItem("shikshasetu_theme")) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    } catch {
      // storage unavailable
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = (localStorage.getItem("studysaathi_theme") || localStorage.getItem("shikshasetu_theme")) as ThemeMode | null;
      if (saved === "dark") return "dark";
      if (saved === "light") return "light";
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    } catch {
      // storage unavailable
    }
    return "light";
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof window === "undefined") return;

    let active: ResolvedTheme = "light";
    if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      active = prefersDark ? "dark" : "light";
    } else {
      active = mode;
    }

    setResolvedTheme(active);

    const root = document.documentElement;
    const body = document.body;
    if (active === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
      if (body) {
        body.classList.add("dark");
        body.setAttribute("data-theme", "dark");
      }
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
      if (body) {
        body.classList.remove("dark");
        body.setAttribute("data-theme", "light");
      }
    }
  }, []);

  useEffect(() => {
    let savedMode: ThemeMode = "system";
    try {
      const saved = (localStorage.getItem("studysaathi_theme") || localStorage.getItem("shikshasetu_theme")) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        savedMode = saved;
      }
    } catch {}

    applyTheme(savedMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      let currentSaved: string | null = null;
      try {
        currentSaved = localStorage.getItem("shikshasetu_theme");
      } catch {}
      if (!currentSaved || currentSaved === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [applyTheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem("studysaathi_theme", mode);
      localStorage.setItem("shikshasetu_theme", mode);
    } catch {
      // storage unavailable
    }
    applyTheme(mode);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
