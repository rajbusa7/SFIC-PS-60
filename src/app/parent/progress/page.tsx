import { redirect } from "next/navigation";

export default function ParentProgressPage() {
  redirect("/parent/dashboard?tab=learning-progress");
}
