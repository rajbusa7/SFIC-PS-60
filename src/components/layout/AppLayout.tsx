"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { HackathonDemoBanner } from "./HackathonDemoBanner";
import { GlobalShikshaBot } from "@/components/shared/GlobalShikshaBot";
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
  const [currentClass, setCurrentClass] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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
        {/* Top header navigation */}
        <AppHeader
          currentClass={currentClass}
          onClassChange={setCurrentClass}
          onSearchChange={setSearchTerm}
        />

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 box-border">
          {showDemoBanner && <HackathonDemoBanner />}
          {children}
        </main>
      </div>

      {/* Global Offline ShikshaBot Assistant */}
      <GlobalShikshaBot />

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF6E9]/95 dark:bg-[#1E1916]/95 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around print:hidden shadow-[0_-4px_20px_rgba(73,53,47,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
                isActive
                  ? "text-[#49352F] dark:text-[#F4F1E1] font-bold bg-[#F2CAB3]/70 dark:bg-[#F2CAB3]/30 shadow-xs"
                  : "text-[#5C4B45] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
