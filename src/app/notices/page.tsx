import { redirect } from "next/navigation";

export default function NoticesRedirectPage() {
  redirect("/connect?tab=announcements");
}
