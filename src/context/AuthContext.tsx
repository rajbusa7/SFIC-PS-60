"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, UserRole, TeacherAssignment, SubjectCode } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  assignments: TeacherAssignment[];
  selectedSubject: SubjectCode | null;
  setSelectedSubject: (subject: SubjectCode | null) => void;
  assignmentNotice?: string | null;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; user: User; assignments: TeacherAssignment[] }>;
  registerTeacher: (name: string, email: string, password?: string, schoolId?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoTeacher: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  loginAsDemoParent: () => Promise<void>;
  loginWithSessionUser: (user: User, assignments?: TeacherAssignment[]) => void;
  refreshSession: () => Promise<User | null>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setHasSeenTutorial: (seen: boolean) => void;
}

const DEMO_TEACHER: User = {
  id: "usr-teacher-01",
  name: "Pooja Sharma",
  email: "teacher@studysaathi.edu.in",
  role: "teacher",
  schoolId: "sch-gn-01",
  provider: "local",
  has_seen_tutorial: true,
};

const DEMO_ADMIN: User = {
  id: "usr-admin-01",
  name: "Principal R. K. Trivedi",
  email: "principal@studysaathi.edu.in",
  role: "admin",
  schoolId: "sch-gn-01",
  provider: "local",
  has_seen_tutorial: true,
};

const DEMO_PARENT: User = {
  id: "par-001",
  name: "Dineshbhai Patel",
  email: "dinesh.patel@example.com",
  role: "parent",
  schoolId: "sch-gn-01",
  provider: "local",
  has_seen_tutorial: true,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "teacher",
  assignments: [],
  selectedSubject: null,
  setSelectedSubject: () => {},
  isDemoMode: false,
  isLoading: true,
  login: async () => ({ success: true, user: DEMO_TEACHER, assignments: [] }),
  registerTeacher: async () => ({ success: true }),
  loginAsDemoTeacher: async () => {},
  loginAsDemoAdmin: async () => {},
  loginAsDemoParent: async () => {},
  loginWithSessionUser: () => {},
  refreshSession: async () => null,
  logout: async () => {},
  switchRole: () => {},
  setHasSeenTutorial: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedSubject, setSelectedSubjectState] = useState<SubjectCode | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);

  const setSelectedSubject = useCallback((sub: SubjectCode | null) => {
    setSelectedSubjectState(sub);
    if (typeof window !== "undefined") {
      if (sub) {
        localStorage.setItem("shikshasetu_selected_subject", sub);
      } else {
        localStorage.removeItem("shikshasetu_selected_subject");
      }
    }
  }, []);

  const saveUserStorage = useCallback((u: User | null, asgs?: TeacherAssignment[]) => {
    if (typeof window === "undefined") return;
    if (u) {
      const serialized = JSON.stringify(u);
      localStorage.setItem("studysaathi_user", serialized);
      localStorage.setItem("shikshasetu_user", serialized);
      if (asgs) {
        localStorage.setItem("studysaathi_assignments", JSON.stringify(asgs));
      }
    } else {
      localStorage.removeItem("studysaathi_user");
      localStorage.removeItem("shikshasetu_user");
      localStorage.removeItem("studysaathi_assignments");
      localStorage.removeItem("shikshasetu_selected_subject");
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
            const u = data.user;
            const cleanEmail = u.email ? u.email.toLowerCase().trim() : u.id;
            const stored = typeof window !== "undefined" ? localStorage.getItem(`shikshasetu_seen_tutorial_${cleanEmail}`) : null;
            const resolvedUser = { ...u, has_seen_tutorial: stored !== null ? stored === "true" : (u.has_seen_tutorial ?? false) };
            setUser(resolvedUser);
            setIsDemoMode(false);
            saveUserStorage(resolvedUser);

            if (data.assignments && Array.isArray(data.assignments)) {
              setAssignments(data.assignments);
              saveUserStorage(resolvedUser, data.assignments);
              const storedSub = typeof window !== "undefined" ? (localStorage.getItem("shikshasetu_selected_subject") as SubjectCode) : null;
              if (storedSub && data.assignments.some((a: TeacherAssignment) => a.subjectCode === storedSub)) {
                setSelectedSubjectState(storedSub);
              } else if (data.assignments.length === 1) {
                setSelectedSubjectState(data.assignments[0].subjectCode);
              }
            }

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
            const cleanEmail = parsed.email ? parsed.email.toLowerCase().trim() : parsed.id;
            const stored = typeof window !== "undefined" ? localStorage.getItem(`shikshasetu_seen_tutorial_${cleanEmail}`) : null;
            const resolvedUser = { ...parsed, has_seen_tutorial: stored !== null ? stored === "true" : (parsed.has_seen_tutorial ?? false) };
            setUser(resolvedUser);
            setIsDemoMode(false);

            // Hydrate assignments immediately to prevent empty state flicker
            const savedAsgs = localStorage.getItem("studysaathi_assignments");
            if (savedAsgs) {
              try {
                const parsedAsgs = JSON.parse(savedAsgs);
                if (Array.isArray(parsedAsgs) && parsedAsgs.length > 0) {
                  setAssignments(parsedAsgs);
                  if (parsedAsgs.length === 1) {
                    setSelectedSubjectState(parsedAsgs[0].subjectCode);
                  }
                }
              } catch {}
            }
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }

      if (isMounted) setIsLoading(false);
    }

    checkServerSession();

    return () => {
      isMounted = false;
    };
  }, [saveUserStorage]);

  const login = async (
    email: string,
    password?: string,
    role: UserRole = "teacher"
  ): Promise<{ success: boolean; user: User; assignments: TeacherAssignment[] }> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Login failed");
    }

    const realUser: User = data.user;
    const realAssignments: TeacherAssignment[] = data.assignments || [];
    setAssignments(realAssignments);

    const cleanEmail = realUser.email ? realUser.email.toLowerCase().trim() : realUser.id;
    const stored = typeof window !== "undefined" ? localStorage.getItem(`shikshasetu_seen_tutorial_${cleanEmail}`) : null;
    const resolvedUser = { ...realUser, has_seen_tutorial: stored !== null ? stored === "true" : (realUser.has_seen_tutorial ?? false) };
    setUser(resolvedUser);
    setIsDemoMode(false);
    saveUserStorage(resolvedUser, realAssignments);

    if (realAssignments.length === 1) {
      setSelectedSubject(realAssignments[0].subjectCode);
    } else {
      const storedSub = typeof window !== "undefined" ? (localStorage.getItem("shikshasetu_selected_subject") as SubjectCode) : null;
      if (storedSub && realAssignments.some((a) => a.subjectCode === storedSub)) {
        setSelectedSubjectState(storedSub);
      }
    }

    return { success: true, user: resolvedUser, assignments: realAssignments };
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
    try {
      await login("teacher@studysaathi.edu.in", "teacher123", "teacher");
    } catch {
      setUser(DEMO_TEACHER);
      saveUserStorage(DEMO_TEACHER);
    }
  };

  const loginAsDemoAdmin = async () => {
    try {
      await login("principal@studysaathi.edu.in", "admin123", "admin");
    } catch {
      setUser(DEMO_ADMIN);
      saveUserStorage(DEMO_ADMIN);
    }
  };

  const loginAsDemoParent = async () => {
    try {
      await login("dinesh.patel@example.com", undefined, "parent");
    } catch {
      setUser(DEMO_PARENT);
      saveUserStorage(DEMO_PARENT);
    }
  };

  const loginWithSessionUser = useCallback(
    (sessionUser: User, newAssignments?: TeacherAssignment[]) => {
      setUser(sessionUser);
      setIsDemoMode(false);
      saveUserStorage(sessionUser, newAssignments);
      if (newAssignments) {
        setAssignments(newAssignments);
        if (newAssignments.length === 1) {
          setSelectedSubject(newAssignments[0].subjectCode);
        }
      }
    },
    [saveUserStorage, setSelectedSubject]
  );

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsDemoMode(false);
          saveUserStorage(data.user);
          if (data.assignments && Array.isArray(data.assignments)) {
            setAssignments(data.assignments);
            saveUserStorage(data.user, data.assignments);

            // Re-validate active selected subject
            setSelectedSubjectState((prevSub) => {
              if (!prevSub) {
                return data.assignments.length === 1 ? data.assignments[0].subjectCode : null;
              }
              const isStillAuthorized = data.assignments.some(
                (a: TeacherAssignment) => a.subjectCode === prevSub
              );
              if (!isStillAuthorized) {
                const fallback = data.assignments.length > 0 ? data.assignments[0].subjectCode : null;
                setAssignmentNotice(
                  "Your subject assignment has changed. Please select an available subject or contact your administrator."
                );
                setTimeout(() => setAssignmentNotice(null), 6000);
                if (typeof window !== "undefined") {
                  if (fallback) {
                    localStorage.setItem("shikshasetu_selected_subject", fallback);
                  } else {
                    localStorage.removeItem("shikshasetu_selected_subject");
                  }
                }
                return fallback;
              }
              return prevSub;
            });
          }
          return data.user;
        }
      }
    } catch (err) {
      console.warn("[AuthContext] Refresh session failed:", err);
    }
    return null;
  }, [saveUserStorage]);

  // Real-time SSE synchronization with 15-second polling fallback
  useEffect(() => {
    if (!user || user.role === "parent") return;

    let es: EventSource | null = null;
    let isSubscribed = true;

    try {
      es = new EventSource("/api/admin/teachers/assignments/stream");
      es.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "ASSIGNMENT_SAVED" || payload.type === "ASSIGNMENT_REMOVED") {
            const isRelevant =
              user.role === "admin" ||
              payload.teacherId === user.id ||
              (user.email && payload.teacherEmail && payload.teacherEmail.toLowerCase() === user.email.toLowerCase());
            if (isRelevant) {
              refreshSession();
            }
          }
        } catch {}
      };
    } catch {}

    const interval = setInterval(() => {
      if (isSubscribed) {
        refreshSession();
      }
    }, 15000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (es) es.close();
    };
  }, [user?.id, user?.email, user?.role, refreshSession]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } catch (e) {
      console.warn("[AuthContext] Logout request failed:", e);
    }
    setUser(null);
    setAssignments([]);
    setSelectedSubjectState(null);
    setIsDemoMode(false);
    saveUserStorage(null);
  };

  const setHasSeenTutorial = useCallback((seen: boolean) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, has_seen_tutorial: seen };
      if (typeof window !== "undefined") {
        const cleanEmail = prev.email ? prev.email.toLowerCase().trim() : prev.id;
        localStorage.setItem(`shikshasetu_seen_tutorial_${cleanEmail}`, String(seen));
      }
      saveUserStorage(updated);
      return updated;
    });
  }, [saveUserStorage]);

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    saveUserStorage(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "teacher",
        assignments,
        selectedSubject,
        setSelectedSubject,
        assignmentNotice,
        isDemoMode,
        isLoading,
        login,
        registerTeacher,
        loginAsDemoTeacher,
        loginAsDemoAdmin,
        loginAsDemoParent,
        loginWithSessionUser,
        refreshSession,
        logout,
        switchRole,
        setHasSeenTutorial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
