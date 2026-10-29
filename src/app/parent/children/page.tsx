import { redirect } from "next/navigation";

export default function ParentChildrenPage() {
  redirect("/parent/dashboard?tab=children");
}

