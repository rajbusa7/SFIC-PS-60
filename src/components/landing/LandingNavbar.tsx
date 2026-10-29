"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Menu, X, ArrowRight, LogIn, BookOpen, Sparkles } from "lucide-react";

export function LandingNavbar() {
  const { t, language } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("#hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setScrollProgress(progress);

      const sections = ["#hero", "#challenge", "#solution", "#features", "#preview", "#impact", "#cta"];
      for (const sec of sections) {
        const el = document.querySelector(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 250) {
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

  const navLinks = [
    { label: language === "gu" ? "મુખ્ય પૃષ્ઠ" : "The Bridge", href: "#hero" },
    { label: language === "gu" ? "પડકાર" : "The Challenge", href: "#challenge" },
    { label: language === "gu" ? "૪ તબક્કા" : "4 Phases", href: "#solution" },
    { label: language === "gu" ? "સુવિધાઓ" : "Features", href: "#features" },
    { label: language === "gu" ? "લાઈવ પ્રિવ્યૂ" : "Live Preview", href: "#preview" },
    { label: language === "gu" ? "પરિણામો" : "Impact", href: "#impact" },
    { label: language === "gu" ? "માર્ગદર્શિકા" : "Tutorial", href: "/tutorial" },
    { label: language === "gu" ? "૩D વર્લ્ડ" : "3D Living World", href: "/landing-pages/inner-green-3d.html" },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* Glowing Bridge Progress Rail at the very top */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#14123D]/60 z-50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-teal-400 to-amber-400 shadow-[0_0_12px_#FF8A3D] transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-[#14123D]/85 backdrop-blur-xl border-b border-white/10 shadow-2xl py-2.5 sm:py-3"
            : "bg-transparent py-4 sm:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo with Bridge glyph & શ */}
          <Link
            href="#hero"
            onClick={(e) => handleSmoothScroll(e, "#hero")}
            className="cursor-pointer group"
          >
            <BrandLogo size={isScrolled ? 34 : 40} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 px-3 py-1.5 rounded-full bg-slate-900/40 border border-white/10 backdrop-blur-md">
            {navLinks.map((item) => {
              const isActive = activeSection === item.href;
              if (item.href.startsWith("/")) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-[0_0_12px_rgba(255,138,61,0.25)] font-bold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <LanguageSelector />
            <ThemeToggle />

            {/* New Teacher Tutorial Link */}
            <Link href="/tutorial">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold shadow-[0_0_15px_rgba(255,138,61,0.25)] flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "gu" ? "ટ્યુટોરિયલ" : "Tutorial & Guide"}</span>
              </Button>
            </Link>

            {/* 3D Living World Landing Link */}
            <Link href="/landing-pages/inner-green-3d.html">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === "gu" ? "૩D વર્લ્ડ" : "3D World"}</span>
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white hover:border-amber-500/40"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.nav?.login || "Sign In"}</span>
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="saffron"
                size="sm"
                className="rounded-full shadow-[0_0_20px_rgba(255,138,61,0.35)]"
              >
                <span>{language === "gu" ? "ડેશબોર્ડ ખોલો" : "Get Started"}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/tutorial" className="p-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">{language === "gu" ? "ટ્યુટોરિયલ" : "Guide"}</span>
            </Link>
            <LanguageSelector />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 border border-slate-700 bg-slate-900/80 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-full bg-[#14123D]/98 backdrop-blur-2xl border-b border-white/10 shadow-2xl px-5 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Tutorial Feature Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-indigo-900/40 border border-amber-500/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === "gu" ? "નવા શિક્ષક માટે ટ્યુટોરિયલ" : "New User? Tutorial & Guide"}</span>
                </p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {language === "gu" ? "વેબસાઇટ કેવી રીતે વાપરવી તે 3 મિનિટમાં જાણો" : "Learn how to use this website in 3 mins"}
                </p>
              </div>
              <Link
                href="/tutorial"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shrink-0 ml-2"
              >
                {language === "gu" ? "શરૂ કરો" : "Open Guide"}
              </Link>
            </div>

            <div className="flex flex-col space-y-1">
              {navLinks.map((item) => {
                if (item.href.startsWith("/")) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(e, item.href)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      activeSection === item.href
                        ? "text-amber-400 bg-amber-500/10 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>{t.nav?.login || "Sign In (Demo Access)"}</span>
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 transition-colors"
              >
                <span>{language === "gu" ? "ડેશબોર્ડ ખોલો" : "Explore Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
