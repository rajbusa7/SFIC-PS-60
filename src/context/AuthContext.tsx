"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, UserRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isDemoMode: boolean;
  login: (email: string, role?: UserRole) => boolean;
  loginAsDemoTeacher: () => void;
  loginAsDemoAdmin: () => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const DEMO_TEACHER: User = {
  id: "usr-teacher-01",
  name: "Pooja Sharma",
  email: "teacher@shikshasetu.edu.in",
  role: "teacher",
  schoolId: "sch-gn-01",
};

const DEMO_ADMIN: User = {
  id: "usr-admin-01",
  name: "Principal R. K. Trivedi",
  email: "principal@shikshasetu.edu.in",
  role: "admin",
  schoolId: "sch-gn-01",
};

const AuthContext = createContext<AuthContextType>({
  user: DEMO_TEACHER,
  role: "teacher",
  isDemoMode: true,
  login: () => true,
  loginAsDemoTeacher: () => {},
  loginAsDemoAdmin: () => {},
  logout: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_TEACHER);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("shikshasetu_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Default to demo teacher for seamless evaluation
        setUser(DEMO_TEACHER);
        localStorage.setItem("shikshasetu_user", JSON.stringify(DEMO_TEACHER));
      }
    } catch {
      setUser(DEMO_TEACHER);
    }
  }, []);

  const login = (email: string, role: UserRole = "teacher") => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: role === "admin" ? "Principal Administrator" : "Class Teacher",
      email,
      role,
      schoolId: "sch-gn-01",
    };
    setUser(newUser);
    localStorage.setItem("shikshasetu_user", JSON.stringify(newUser));
    return true;
  };

  const loginAsDemoTeacher = () => {
    setUser(DEMO_TEACHER);
    setIsDemoMode(true);
    localStorage.setItem("shikshasetu_user", JSON.stringify(DEMO_TEACHER));
  };

  const loginAsDemoAdmin = () => {
    setUser(DEMO_ADMIN);
    setIsDemoMode(true);
    localStorage.setItem("shikshasetu_user", JSON.stringify(DEMO_ADMIN));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("shikshasetu_user");
  };

  const switchRole = (newRole: UserRole) => {
    const targetUser = newRole === "admin" ? DEMO_ADMIN : DEMO_TEACHER;
    setUser(targetUser);
    localStorage.setItem("shikshasetu_user", JSON.stringify(targetUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "teacher",
        isDemoMode,
        login,
        loginAsDemoTeacher,
        loginAsDemoAdmin,
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
