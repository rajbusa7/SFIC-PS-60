import { redirect } from "next/navigation";

export default function ParentLearningGapsPage() {
  redirect("/parent/dashboard?tab=help-at-home");
}
