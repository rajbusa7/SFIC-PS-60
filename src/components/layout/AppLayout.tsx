"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { HackathonDemoBanner } from "./HackathonDemoBanner";
import { GlobalShikshaBot } from "@/components/shared/GlobalShikshaBot";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  ClipboardList,
  FileText,
  BookOpen,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  showDemoBanner?: boolean;
}

export function AppLayout({ children, showDemoBanner = true }: AppLayoutProps) {
  const pathname = usePathname();

  const mobileNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Students", icon: Users },
    { href: "/learning-gaps", label: "Gaps", icon: AlertTriangle },
    { href: "/remedial-plans", label: "Plans", icon: ClipboardList },
    { href: "/tutorial", label: "Tutorial", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#F4F1E1] text-[#49352F] dark:bg-[#1B1614] dark:text-[#F4F1E1] flex transition-colors duration-200 pb-16 lg:pb-0">
      {/* Sidebar navigation for desktop */}
      <AppSidebar />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full lg:pl-64 transition-all">
        {/* Top header navigation connected to global FilterContext */}
        <AppHeader />

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 box-border">
          {showDemoBanner && <HackathonDemoBanner />}
          {children}
        </main>
      </div>

      {/* Global Offline ShikshaBot Assistant */}
      <GlobalShikshaBot />

      {/* Interactive Spotlight Guided Walkthrough Tour */}
      <SpotlightTour />

      {/* Mobile Bottom Navigation Bar (Hidden on desktop/tablet) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF6E9]/95 dark:bg-[#1E1916]/95 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 backdrop-blur-md px-2 py-1.5 flex items-center justify-around lg:hidden shadow-[0_-2px_10px_rgba(73,53,47,0.05)] print:hidden"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? "text-[#B26A1B] dark:text-[#F2CAB3] bg-[#F2CAB3]/30 dark:bg-[#F2CAB3]/15 font-black"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/60 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
