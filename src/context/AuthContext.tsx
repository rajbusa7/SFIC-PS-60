"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, UserRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  registerTeacher: (name: string, email: string, password?: string, schoolId?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoTeacher: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  loginAsDemoParent: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const DEMO_TEACHER: User = {
  id: "usr-teacher-01",
  name: "Pooja Sharma",
  email: "teacher@studysaathi.edu.in",
  role: "teacher",
  schoolId: "sch-gn-01",
  provider: "local",
};

const DEMO_ADMIN: User = {
  id: "usr-admin-01",
  name: "Principal R. K. Trivedi",
  email: "principal@studysaathi.edu.in",
  role: "admin",
  schoolId: "sch-gn-01",
  provider: "local",
};

const DEMO_PARENT: User = {
  id: "par-001",
  name: "Dineshbhai Patel",
  email: "dinesh.patel@example.com",
  role: "parent",
  schoolId: "sch-gn-01",
  provider: "local",
};

const AuthContext = createContext<AuthContextType>({
  user: DEMO_TEACHER,
  role: "teacher",
  isDemoMode: true,
  isLoading: false,
  login: async () => true,
  registerTeacher: async () => ({ success: true }),
  loginAsDemoTeacher: async () => {},
  loginAsDemoAdmin: async () => {},
  loginAsDemoParent: async () => {},
  logout: async () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_TEACHER);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveUserStorage = useCallback((u: User | null) => {
    if (typeof window === "undefined") return;
    if (u) {
      const serialized = JSON.stringify(u);
      localStorage.setItem("studysaathi_user", serialized);
      localStorage.setItem("shikshasetu_user", serialized);
    } else {
      localStorage.removeItem("studysaathi_user");
      localStorage.removeItem("shikshasetu_user");
    }
  }, []);

  // Synchronize authenticated session from server cookie on load
  useEffect(() => {
    let isMounted = true;

    async function checkServerSession() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user && isMounted) {
            setUser(data.user);
            setIsDemoMode(Boolean(data.isDemo));
            saveUserStorage(data.user);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("[AuthContext] Session verification check failed:", err);
      }

      // Check localStorage if server session is not yet active
      if (typeof window !== "undefined" && isMounted) {
        try {
          const saved =
            localStorage.getItem("studysaathi_user") ||
            localStorage.getItem("shikshasetu_user");
          if (saved) {
            const parsed = JSON.parse(saved);
            setUser(parsed);
            setIsDemoMode(parsed.provider !== "google");
          } else {
            // Default demo fallback for seamless evaluation
            setUser(DEMO_TEACHER);
            setIsDemoMode(true);
            saveUserStorage(DEMO_TEACHER);
          }
        } catch {
          setUser(DEMO_TEACHER);
        }
      }

      if (isMounted) setIsLoading(false);
    }

    checkServerSession();

    return () => {
      isMounted = false;
    };
  }, [saveUserStorage]);

  const establishServerSession = async (email: string, role: UserRole) => {
    try {
      await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
    } catch (e) {
      console.warn("[AuthContext] Unable to set server session cookie:", e);
    }
  };

  const login = async (email: string, role: UserRole = "teacher"): Promise<boolean> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name:
        role === "admin"
          ? "Principal Administrator"
          : role === "parent"
          ? "Guardian/Parent"
          : "Class Teacher",
      email,
      role,
      schoolId: "sch-gn-01",
      provider: "local",
    };
    setUser(newUser);
    setIsDemoMode(false);
    saveUserStorage(newUser);
    await establishServerSession(email, role);
    return true;
  };

  const registerTeacher = async (
    name: string,
    email: string,
    password?: string,
    schoolId = "sch-gn-01"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, schoolId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to register" };
      }

      setUser(data.user);
      setIsDemoMode(false);
      saveUserStorage(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const loginAsDemoTeacher = async () => {
    setUser(DEMO_TEACHER);
    setIsDemoMode(true);
    saveUserStorage(DEMO_TEACHER);
    await establishServerSession(DEMO_TEACHER.email, "teacher");
  };

  const loginAsDemoAdmin = async () => {
    setUser(DEMO_ADMIN);
    setIsDemoMode(true);
    saveUserStorage(DEMO_ADMIN);
    await establishServerSession(DEMO_ADMIN.email, "admin");
  };

  const loginAsDemoParent = async () => {
    setUser(DEMO_PARENT);
    setIsDemoMode(true);
    saveUserStorage(DEMO_PARENT);
    await establishServerSession(DEMO_PARENT.email, "parent");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } catch {}

    setUser(null);
    setIsDemoMode(false);
    saveUserStorage(null);
  };

  const switchRole = (newRole: UserRole) => {
    const targetUser =
      newRole === "admin"
        ? DEMO_ADMIN
        : newRole === "parent"
        ? DEMO_PARENT
        : DEMO_TEACHER;
    setUser(targetUser);
    saveUserStorage(targetUser);
    establishServerSession(targetUser.email, newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "teacher",
        isDemoMode,
        isLoading,
        login,
        registerTeacher,
        loginAsDemoTeacher,
        loginAsDemoAdmin,
        loginAsDemoParent,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
