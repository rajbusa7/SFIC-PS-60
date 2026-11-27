import React from "react";
import type { Metadata } from "next";
import { InnerGreenLandingClient } from "@/components/landing/InnerGreenLandingClient";

export const metadata: Metadata = {
  title: "StudySaathi AI — Every Child Can Learn. AI Helps Us Find the Way.",
  description:
    "Identify learning gaps early, understand each student's needs, and create personalized remedial learning plans with AI. Helping teachers turn learning challenges into meaningful progress.",
};

export default function HomePage() {
  return <InnerGreenLandingClient />;
}
