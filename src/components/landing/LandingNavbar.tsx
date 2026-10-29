"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import {
  Menu,
  X,
  ArrowRight,
  LogIn,
  BookOpen,
  Sparkles,
  ChevronDown,
  Layers,
  Cpu,
  Activity,
  TrendingUp,
  AlertTriangle,
  Compass,
  ExternalLink,
  Users,
} from "lucide-react";

export function LandingNavbar() {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("#hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  const exploreRef = useRef<HTMLDivElement>(null);

  // 1. Precise Scroll Progress & Active Section Spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;
      setScrollProgress(progress);

      // Scroll Spy for sections
      if (scrollY < 120) {
        setActiveSection("#hero");
        return;
      }

      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 100) {
        setActiveSection("#impact");
        return;
      }

      const sections = ["#hero", "#challenge", "#solution", "#features", "#preview", "#impact"];
      for (const sec of sections) {
        const el = document.querySelector(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 100) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Click outside & Escape key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setIsExploreOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExploreOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 3. Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Navigation Links definition
  const navLinks = [
    { label: language === "gu" ? "મુખ્ય સેતુ" : "The Bridge", href: "#hero", icon: Sparkles },
    { label: language === "gu" ? "પડકાર" : "Challenge", href: "#challenge", icon: AlertTriangle },
    { label: language === "gu" ? "૪ તબક્કા" : "4 Phases", href: "#solution", icon: Layers },
    { label: language === "gu" ? "સુવિધાઓ" : "Features", href: "#features", icon: Cpu },
    { label: language === "gu" ? "લાઈવ પ્રિવ્યૂ" : "Preview", href: "#preview", icon: Activity },
    { label: language === "gu" ? "પરિણામો" : "Impact", href: "#impact", icon: TrendingUp },
  ];

  // Robust smooth navigation handler
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      setIsExploreOpen(false);

      if (pathname !== "/") {
        router.push(`/${href}`);
        return;
      }

      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const navOffset = 76;
        const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });

        window.history.pushState(null, "", href);
        setActiveSection(href);
      }
    } else {
      setIsMobileMenuOpen(false);
      setIsExploreOpen(false);
    }
  };

  return (
    <>
      {/* 1. Ambient Top Scroll Progress Rail with Comet Glow */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-slate-900/60 z-50 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-teal-400 to-amber-300 shadow-[0_0_12px_rgba(255,138,61,0.9)] transition-all duration-100 ease-out relative"
          style={{ width: `${scrollProgress}%` }}
        >
          {/* Glowing particle at the tip */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff]" />
        </div>
      </div>

      {/* 2. Glassmorphic Fixed Header Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0c0a24]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.5)] py-2.5 sm:py-3"
            : "bg-gradient-to-b from-[#0c0a24]/80 via-[#0c0a24]/30 to-transparent py-3.5 sm:py-4.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo & GovTech Status */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="#hero"
              onClick={(e) => handleNavClick(e, "#hero")}
              className="cursor-pointer group flex items-center gap-2.5 transition-transform duration-200 active:scale-95"
            >
              <BrandLogo size={isScrolled ? 34 : 38} variant="dark" />
            </Link>

            {/* Live Hackathon Status Indicator */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>SFIC PS-60 Live</span>
            </div>
          </div>

          {/* Center Navigation Capsule (The Floating Pill Dock) */}
          <nav
            aria-label="Desktop Navigation"
            className="hidden lg:flex items-center gap-0.5 px-2 py-1 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] ring-1 ring-white/5"
          >
            {navLinks.map((item) => {
              const isActive = activeSection === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                    isActive
                      ? "text-amber-300 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {/* Smooth Animated Active Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSectionIndicator"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 shadow-[0_0_12px_rgba(255,138,61,0.2)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}

            {/* Explore Dropdown Menu */}
            <div className="relative ml-0.5" ref={exploreRef}>
              <button
                type="button"
                onClick={() => setIsExploreOpen(!isExploreOpen)}
                aria-expanded={isExploreOpen}
                aria-haspopup="true"
                className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer select-none ${
                  isExploreOpen
                    ? "text-amber-300 bg-white/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{language === "gu" ? "અન્વેષણ" : "Explore"}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isExploreOpen ? "rotate-180 text-amber-400" : "text-slate-400"
                  }`}
                />
              </button>

              {/* Popover Card */}
              <AnimatePresence>
                {isExploreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full right-0 lg:left-1/2 lg:-translate-x-1/2 mt-2.5 w-80 rounded-2xl bg-[#0c0a24]/95 backdrop-blur-2xl border border-white/15 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 ring-1 ring-white/10"
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {language === "gu" ? "વિશેષ સુવિધાઓ" : "Interactive Experience"}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {language === "gu" ? "શિક્ષકો અને નિરીક્ષકો માટે સંસાધનો" : "Tools for Gujarat Teachers & Evaluators"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      {/* Teacher Tutorial */}
                      <Link
                        href="/tutorial"
                        onClick={() => setIsExploreOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition-colors">
                          <BookOpen className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {language === "gu" ? "શિક્ષક માર્ગદર્શિકા" : "Teacher Tutorial & Guide"}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              5 Min
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                            {language === "gu" ? "વેબસાઇટ કેવી રીતે વાપરવી તે 3 મિનિટમાં જાણો" : "Interactive walkthrough for primary school teachers"}
                          </p>
                        </div>
                      </Link>

                      {/* 3D Living World Canvas */}
                      <Link
                        href="/landing-pages/inner-green-3d.html"
                        onClick={() => setIsExploreOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {language === "gu" ? "૩D લિવિંગ વર્લ્ડ" : "3D Living World Canvas"}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              WebGL
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                            {language === "gu" ? "વિદ્યાર્થી પ્રગતિનું 3D પરિમાણીય પ્રદર્શન" : "Explore holographic 3D student skill biosphere"}
                          </p>
                        </div>
                      </Link>

                      {/* AI Workspace Link */}
                      <Link
                        href="/ai"
                        onClick={() => setIsExploreOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/25 transition-colors">
                          <Cpu className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {language === "gu" ? "AI વર્કસ્પેસ હબ" : "AI Hub & Remedial Suite"}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              5-in-1
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                            {language === "gu" ? "ક્વિઝ, સૂચના અનુવાદ અને ઑડિયો ટ્યુટર" : "Instant remedial generator & parent notices"}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Desktop Right Action Hub */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Language Switcher with Glass Style */}
            <LanguageSelector variant="glass" />

            {/* Theme Toggle with Glass Style */}
            <ThemeToggle variant="glass" />

            {/* Sign In Button (Teacher) */}
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-200 hover:text-white border border-white/10 hover:border-amber-400/40 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5 shadow-inner"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.nav?.login || "Sign In"}</span>
            </Link>

            {/* Parent Login Button */}
            <Link
              href="/parent/login"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#F2CAB3] hover:text-white border border-[#F2CAB3]/30 hover:border-[#F2CAB3]/60 bg-[#F2CAB3]/10 hover:bg-[#F2CAB3]/25 transition-all flex items-center gap-1.5 shadow-inner"
            >
              <Users className="w-3.5 h-3.5 text-[#F2CAB3]" />
              <span>{language === "gu" ? "વાલી પ્રવેશ" : "Parent Login"}</span>
            </Link>

            {/* Primary Action Button: Explore Dashboard */}
            <Link
              href="/dashboard"
              className="relative group px-4 py-2 rounded-full text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_20px_rgba(255,138,61,0.4)] hover:shadow-[0_0_28px_rgba(255,138,61,0.65)] transition-all flex items-center gap-1.5 active:scale-95 overflow-hidden"
            >
              <span>{language === "gu" ? "ડેશબોર્ડ ખોલો" : "Explore Dashboard"}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile Bar Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector variant="glass" />

            {/* Mobile Animated Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="relative p-2.5 rounded-xl text-slate-300 hover:text-white border border-white/10 bg-slate-900/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* 3. Full-Screen Mobile Drawer Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden fixed inset-x-0 top-full bg-[#0c0a24]/98 backdrop-blur-3xl border-b border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[calc(100vh-4.5rem)] px-5 py-6 space-y-4"
            >
              {/* Featured Tutorial Quick Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-indigo-950/40 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === "gu" ? "નવા શિક્ષક માર્ગદર્શિકા" : "Teacher Quick Start Guide"}</span>
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {language === "gu" ? "વેબસાઇટ કેવી રીતે વાપરવી તે 3 મિનિટમાં જાણો" : "Learn how to use StudySaathi in 3 mins"}
                  </p>
                </div>
                <Link
                  href="/tutorial"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shrink-0 ml-2 shadow-[0_0_12px_rgba(255,138,61,0.4)]"
                >
                  {language === "gu" ? "જુઓ" : "Open"}
                </Link>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "text-amber-300 bg-amber-500/15 border border-amber-500/30 font-bold"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#FF8A3D]" />
                      )}
                    </a>
                  );
                })}
              </div>

              {/* Special Resources Row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <Link
                  href="/landing-pages/inner-green-3d.html"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex flex-col gap-1 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold">3D</span>
                  </div>
                  <span>{language === "gu" ? "૩D લિવિંગ વર્લ્ડ" : "3D Living World"}</span>
                </Link>

                <Link
                  href="/ai"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold flex flex-col gap-1 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold">AI</span>
                  </div>
                  <span>{language === "gu" ? "AI વર્કસ્પેસ" : "AI Suite"}</span>
                </Link>
              </div>

              {/* Preferences: Theme Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-semibold text-slate-300">
                  {language === "gu" ? "થીમ મોડ" : "Theme Mode"}
                </span>
                <ThemeToggle variant="glass" showLabel />
              </div>

              {/* Mobile CTAs */}
              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>{t.nav?.login || "Sign In (Teacher Portal)"}</span>
                </Link>

                <Link
                  href="/parent/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold border border-[#F2CAB3]/30 bg-[#F2CAB3]/10 hover:bg-[#F2CAB3]/20 text-[#F2CAB3] transition-colors"
                >
                  <Users className="w-4 h-4 text-[#F2CAB3]" />
                  <span>{language === "gu" ? "વાલી પ્રવેશ (Parent Portal)" : "Parent Portal (Parent Login)"}</span>
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(255,138,61,0.4)] transition-all active:scale-95"
                >
                  <span>{language === "gu" ? "ડેશબોર્ડ ખોલો" : "Explore Dashboard"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-slate-400">
                  Gujarat Primary Education Remedial Action System • SFIC PS-60
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
