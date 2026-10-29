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
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] text-slate-900 dark:text-slate-100 flex transition-colors duration-200 pb-16 lg:pb-0">
      {/* Sidebar navigation for desktop */}
      <AppSidebar />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        {/* Top header navigation */}
        <AppHeader
          currentClass={currentClass}
          onClassChange={setCurrentClass}
          onSearchChange={setSearchTerm}
        />

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {showDemoBanner && <HackathonDemoBanner />}
          {children}
        </main>
      </div>

      {/* Global Offline ShikshaBot 3D Orb Assistant */}
      <GlobalShikshaBot />

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#14123D]/95 border-t border-slate-200 dark:border-white/10 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around print:hidden shadow-lg"
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
                  ? "text-amber-500 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
