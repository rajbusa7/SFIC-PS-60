import type { User } from "../types/student";

export const DEMO_TEACHER: User = {
  id: "usr-teacher-01",
  name: "Pooja Sharma",
  email: "teacher@shikshasetu.edu.in",
  role: "teacher",
  schoolId: "sch-gn-01",
};

export const DEMO_ADMIN: User = {
  id: "usr-admin-01",
  name: "Principal R. K. Trivedi",
  email: "principal@shikshasetu.edu.in",
  role: "admin",
  schoolId: "sch-gn-01",
};

export const DEMO_PARENT: User = {
  id: "par-001",
  name: "Dineshbhai Patel",
  email: "dinesh.patel@example.com",
  role: "parent",
  schoolId: "sch-gn-01",
  provider: "local",
};
