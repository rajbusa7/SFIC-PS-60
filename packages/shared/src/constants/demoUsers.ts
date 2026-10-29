import type { User } from "../types/student";

export const DEMO_TEACHER: User = {
  id: "usr-teacher-01",
  name: "Pooja Sharma",
  email: "teacher@studysaathi.edu.in",
  phone: "+919876543210",
  phoneVerified: true,
  role: "teacher",
  schoolId: "sch-gn-01",
};

export const DEMO_ADMIN: User = {
  id: "usr-admin-01",
  name: "Principal R. K. Trivedi",
  email: "principal@studysaathi.edu.in",
  phone: "+919876543211",
  phoneVerified: true,
  role: "admin",
  schoolId: "sch-gn-01",
};

export const DEMO_PARENT: User = {
  id: "par-001",
  name: "Dineshbhai Patel",
  email: "dinesh.patel@example.com",
  phone: "+919825012345",
  phoneVerified: true,
  role: "parent",
  schoolId: "sch-gn-01",
  provider: "local",
};
