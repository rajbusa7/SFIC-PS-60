"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import "@/app/landing-3d.css";

declare global {
  interface Window {
    THREE?: unknown;
    __initStudySaathiLanding?: (rootEl: HTMLElement) => () => void;
    __measureStudySaathiDock?: () => void;
  }
}

export function InnerGreenLandingClient() {
  const { t, language } = useLanguage();
  const l = t.landing3d;
  const rootRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const tryMountLanding = useCallback(() => {
    if (!rootRef.current || cleanupRef.current) return;
    if (!window.THREE || typeof window.__initStudySaathiLanding !== "function") return;
    cleanupRef.current = window.__initStudySaathiLanding(rootRef.current);
  }, []);

  // Mount / clean up 3D moss canvas, liquid metal shaders, dock magnification, and pixel reveal
  useEffect(() => {
    tryMountLanding();
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [tryMountLanding]);

  // Re-measure floating dock widths cleanly whenever translated labels change
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.__measureStudySaathiDock === "function") {
      const id = requestAnimationFrame(() => {
        window.__measureStudySaathiDock?.();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [language]);

  const scrollToSection = (id: string) => {
    if (typeof document === "undefined") return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={rootRef} className="landing-3d-root js">
      <Script
        src="/landing-pages/inner-green-assets/three.min.js"
        strategy="afterInteractive"
        onLoad={tryMountLanding}
      />
      <Script
        src="/landing-pages/inner-green-assets/landing-3d-runtime.js"
        strategy="afterInteractive"
        onLoad={tryMountLanding}
      />

      {/* SECTION 1 — 3D INTERACTIVE HERO */}
      <main className="hero" id="hero">
        <canvas id="scene" />

        <div className="dock-wrap">
          <nav className="dock par-dock" style={{ ["--pd" as string]: 5 }} data-spec aria-label={l.nav.ariaLabel}>
            <a
              className="dock-item dock-mark"
              data-dock
              data-spec
              data-burst
              href="#hero"
              style={{ ["--d" as string]: "30ms" }}
              aria-label={l.nav.homeAria}
            >
              <svg viewBox="0 0 22 24" aria-hidden="true">
                <path d="M11 1.3c-2.1 0-3.95 1.2-4.75 2.95C3.95 4.55 2.3 6.25 2.3 8.35c0 2.3 1.9 4.2 4.3 4.2h8.8c2.4 0 4.3-1.9 4.3-4.2 0-2.1-1.65-3.8-4-4.1C14.95 2.5 13.1 1.3 11 1.3Z" />
                <path d="M9.6 12.55h2.8v4.2c1.35.3 2.45 1.15 3.15 2.4-1.35.4-2.4.15-3.15-.4v4.15H9.6v-4.15c-.75.55-1.8.8-3.15.4.7-1.25 1.8-2.1 3.15-2.4v-4.2Z" />
              </svg>
              <span className="dock-brand-text">
                StudySaathi <span style={{ color: "#B26A1B" }}>AI</span>
              </span>
            </a>

            <a
              className="dock-item is-active"
              data-dock
              data-spec
              data-burst
              href="#hero"
              style={{ ["--d" as string]: "45ms" }}
              aria-label={l.nav.home}
            >
              <span className="glyph" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M8 14V9" />
                  <path d="M8 9c0-2.4 1.7-4.3 4-4.3.2 2.6-1.6 4.6-4 4.3Z" />
                  <path d="M8 10.5C7.9 8.4 6.4 6.8 4.4 6.8 4.3 8.9 5.9 10.6 8 10.5Z" />
                </svg>
              </span>
              <span>{l.nav.home}</span>
            </a>

            <a
              className="dock-item"
              data-dock
              data-spec
              data-burst
              href="#how-it-works"
              style={{ ["--d" as string]: "60ms" }}
              aria-label={l.nav.howItWorks}
            >
              <span className="glyph" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3l2 2" />
                </svg>
              </span>
              <span>{l.nav.howItWorks}</span>
            </a>

            <a
              className="dock-item"
              data-dock
              data-spec
              data-burst
              href="#features"
              style={{ ["--d" as string]: "75ms" }}
              aria-label={l.nav.features}
            >
              <span className="glyph" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M2 3h12v10H2z" />
                  <path d="M2 7h12" />
                </svg>
              </span>
              <span>{l.nav.features}</span>
            </a>

            <a
              className="dock-item"
              data-dock
              data-spec
              data-burst
              href="#for-teachers"
              style={{ ["--d" as string]: "90ms" }}
              aria-label={l.nav.forTeachers}
            >
              <span className="glyph" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M13 14s1 0 1-1-1-4-6-4-6 3-6 4 1 1 1 1z" />
                  <circle cx="8" cy="5" r="3" />
                </svg>
              </span>
              <span>{l.nav.forTeachers}</span>
            </a>

            <Link
              className="dock-item"
              data-dock
              data-spec
              data-burst
              href="/login"
              style={{ ["--d" as string]: "105ms" }}
              aria-label={l.nav.signIn}
            >
              <span className="glyph" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M6 2h6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6" />
                  <path d="M9 8H1" />
                  <path d="m5 4-4 4 4 4" />
                </svg>
              </span>
              <span>{l.nav.signIn}</span>
            </Link>

            <Link
              className="dock-item dock-item--enter"
              data-dock
              data-spec
              data-burst
              href="/dashboard"
              style={{ ["--d" as string]: "120ms" }}
              aria-label={l.nav.getStarted}
            >
              <span className="glyph" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M6.6 2.5h5.1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6.6" />
                  <path d="M2.6 8h6.6" />
                  <path d="m7 5.6 2.4 2.4L7 10.4" />
                </svg>
              </span>
              <span>{l.nav.getStarted}</span>
            </Link>
          </nav>

          {/* Integrated Searchable 23-Locale Switcher */}
          <div className="dock-lang-slot" data-lang-selector="true">
            <LanguageSelector className="landing-lang-trigger" />
          </div>
        </div>

        <div className="stage" id="stage">
          <div className="guides fade" style={{ ["--d" as string]: "40ms" }} aria-hidden="true">
            <i style={{ insetInlineStart: "calc(405 * var(--u))" }} />
            <i style={{ insetInlineStart: "calc(748 * var(--u))" }} />
            <i style={{ insetInlineStart: "calc(1091 * var(--u))" }} />
          </div>

          <div
            className="ghost fade"
            style={{ ["--d" as string]: "60ms", cursor: "pointer" }}
            onClick={() => scrollToSection("hero")}
            aria-hidden="true"
          >
            STUDYSAATHI
          </div>

          {/* Card 1: Learning Insights */}
          <article
            className="card card--about mask"
            style={{ ["--d" as string]: "70ms", ["--pd" as string]: 10, ["--pr" as string]: 2.2, cursor: "pointer" }}
            onClick={() => scrollToSection("features")}
          >
            <figure className="portal" data-delay="60">
              <span className="portal-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing-pages/inner-green-assets/card-ethos.jpg"
                  alt={l.hero.card1ImgAlt}
                  loading="eager"
                  decoding="async"
                />
              </span>
              <canvas className="pixel-reveal" aria-hidden="true" />
            </figure>
            <div className="card-text-block">
              <p className="label">{l.hero.card1Label}</p>
              <div className="card-heading">{l.hero.card1Heading}</div>
              <div className="card-meta">
                <span className="card-meta-pill">{l.hero.card1Pill}</span>
                <span className="card-meta-desc">{l.hero.card1Desc}</span>
                <span className="card-demo-badge">{l.hero.demoTag}</span>
              </div>
            </div>
          </article>

          <span className="knob-float" style={{ ["--pd" as string]: 10, ["--pr" as string]: 2.2 }}>
            <button
              type="button"
              className="knob knob--about mask-circle"
              style={{ ["--d" as string]: "80ms" }}
              aria-label={l.hero.card1KnobAria}
              onClick={() => scrollToSection("features")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </button>
          </span>

          <div className="hero-content-block" style={{ ["--pd" as string]: 18, ["--pr" as string]: 1.2 }}>
            <div className="hero-brand fade" style={{ ["--d" as string]: "30ms" }} aria-label={l.hero.brandLabel}>
              <span className="hero-brand-mark" aria-hidden="true">
                <svg viewBox="0 0 22 24">
                  <path d="M11 1.3c-2.1 0-3.95 1.2-4.75 2.95C3.95 4.55 2.3 6.25 2.3 8.35c0 2.3 1.9 4.2 4.3 4.2h8.8c2.4 0 4.3-1.9 4.3-4.2 0-2.1-1.65-3.8-4-4.1C14.95 2.5 13.1 1.3 11 1.3Z" />
                  <path d="M9.6 12.55h2.8v4.2c1.35.3 2.45 1.15 3.15 2.4-1.35.4-2.4.15-3.15-.4v4.15H9.6v-4.15c-.75.55-1.8.8-3.15.4.7-1.25 1.8-2.1 3.15-2.4v-4.2Z" />
                </svg>
              </span>
              <div className="hero-brand-text">
                <span className="hero-brand-study">{l.hero.brandStudy}</span>
                <span className="hero-brand-ai">
                  {l.hero.brandAi}
                  <span className="hero-brand-ai-line" aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="hero-badge fade" style={{ ["--d" as string]: "45ms" }}>
              <svg
                viewBox="0 0 24 24"
                className="hero-badge-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              <span>{l.hero.platformBadge}</span>
            </div>

            <h1 className="headline">
              <span>
                <i style={{ ["--d" as string]: "60ms" }}>{l.hero.headlineLine1}</i>
              </span>
              <span>
                <i style={{ ["--d" as string]: "80ms" }}>{l.hero.headlineLine2}</i>
              </span>
            </h1>

            <p className="lede mask" style={{ ["--d" as string]: "90ms" }}>
              {l.hero.lede}
            </p>

            <div className="hero-actions fade" style={{ ["--d" as string]: "100ms" }}>
              <div className="hero-explore-slot">
                <div className="pill-clip">
                  <div className="pill" style={{ ["--pd" as string]: 15, ["--pr" as string]: 1.4 }}>
                    <div className="liquid-stage liquid-stage--explore" data-liquid-metal="explore">
                      <div className="liquid-plate plate" aria-hidden="true" />
                      <canvas className="liquid-fx" aria-hidden="true" />
                      <button
                        className="liquid-button liquid-button--explore btn"
                        type="button"
                        onClick={() => scrollToSection("challenge")}
                      >
                        <svg
                          className="ico"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          style={{ width: "calc(18 * var(--u))", height: "calc(18 * var(--u))" }}
                        >
                          <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                        <span className="lbl">{l.hero.exploreCta}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/login" className="hero-secondary-btn" aria-label={l.hero.teacherLogin}>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: "calc(16 * var(--u))", height: "calc(16 * var(--u))" }}
                  aria-hidden="true"
                >
                  <path d="M13 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3M8 14l4-4-4-4M12 10H3" />
                </svg>
                <span>{l.hero.teacherLogin}</span>
              </Link>

              <span className="play-wrap">
                <span className="play-clip">
                  <span className="play-glass mask-circle" style={{ ["--d" as string]: "110ms" }}>
                    <span className="liquid-stage liquid-stage--play" data-liquid-metal="play">
                      <span className="liquid-plate plate" aria-hidden="true" />
                      <canvas className="liquid-fx" aria-hidden="true" />
                      <Link
                        href="/tutorial"
                        className="liquid-button liquid-button--play btn"
                        aria-label={l.hero.tutorialAria}
                      >
                        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8 5.2v13.6L19 12z" fill="currentColor" />
                        </svg>
                      </Link>
                    </span>
                  </span>
                </span>
                <span className="play-ring mask-circle" style={{ ["--d" as string]: "100ms" }} aria-hidden="true" />
              </span>
            </div>
          </div>

          <dl className="stat stat--a mask" style={{ ["--d" as string]: "80ms", ["--pd" as string]: 12 }}>
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="15" cy="15" r="11" strokeDasharray="2 3" />
                <circle cx="15" cy="15" r="6" />
                <path d="M15 11v4l3 2" />
              </svg>
            </span>
            <div>
              <dt>{l.hero.statATitle}</dt>
              <dd>{l.hero.statAValue}</dd>
            </div>
          </dl>

          <dl className="stat stat--b mask" style={{ ["--d" as string]: "90ms", ["--pd" as string]: 13 }}>
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M15 3.5v5" />
                <path d="M15 21.5v5" />
                <path d="M3.5 15h5" />
                <path d="M21.5 15h5" />
                <circle cx="15" cy="15" r="4.5" />
              </svg>
            </span>
            <div>
              <dt>{l.hero.statBTitle}</dt>
              <dd>{l.hero.statBValue}</dd>
            </div>
          </dl>

          {/* Card 2: Student Progress */}
          <article
            className="card card--stove mask"
            style={{ ["--d" as string]: "100ms", ["--pd" as string]: 22, ["--pr" as string]: 2.4, cursor: "pointer" }}
            onClick={() => scrollToSection("how-it-works")}
          >
            <div className="card-text-block">
              <p className="label">{l.hero.card2Label}</p>
              <div className="card-heading">{l.hero.card2Heading}</div>
              <div className="card-meta">
                <span className="card-meta-pill">{l.hero.card2Pill}</span>
                <span className="card-meta-desc">{l.hero.card2Desc}</span>
                <span className="card-demo-badge">{l.hero.demoTag}</span>
              </div>
            </div>
            <figure className="portal" data-delay="90">
              <span className="portal-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing-pages/inner-green-assets/card-ecostove.jpg"
                  alt={l.hero.card2ImgAlt}
                  loading="eager"
                  decoding="async"
                />
              </span>
              <canvas className="pixel-reveal" aria-hidden="true" />
            </figure>
            <button
              type="button"
              className="knob"
              aria-label={l.hero.card2KnobAria}
              onClick={(e) => {
                e.stopPropagation();
                scrollToSection("how-it-works");
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </button>
          </article>

          <a
            className="scroll mask"
            style={{ ["--d" as string]: "110ms", ["--pd" as string]: 9 }}
            href="#challenge"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("challenge");
            }}
          >
            {l.hero.scrollExplore}
            <span className="track" />
          </a>
        </div>
      </main>

      {/* SECTION 2 — THE LEARNING CHALLENGE */}
      <section id="challenge" className="edu-section edu-section--cream">
        <div className="edu-container">
          <div className="edu-header">
            <span className="edu-badge">{l.challenge.badge}</span>
            <h2 className="edu-title">{l.challenge.title}</h2>
            <p className="edu-desc">{l.challenge.desc}</p>
          </div>

          <div className="edu-grid-3">
            <div className="edu-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="edu-card-title">{l.challenge.c1Title}</h3>
              <p className="edu-card-text">{l.challenge.c1Text}</p>
              <div className="edu-card-tag">{l.challenge.c1Tag}</div>
            </div>

            <div className="edu-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="edu-card-title">{l.challenge.c2Title}</h3>
              <p className="edu-card-text">{l.challenge.c2Text}</p>
              <div className="edu-card-tag">{l.challenge.c2Tag}</div>
            </div>

            <div className="edu-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="edu-card-title">{l.challenge.c3Title}</h3>
              <p className="edu-card-text">{l.challenge.c3Text}</p>
              <div className="edu-card-tag">{l.challenge.c3Tag}</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section id="how-it-works" className="edu-section edu-section--beige">
        <div className="edu-container">
          <div className="edu-header">
            <span className="edu-badge">{l.howItWorks.badge}</span>
            <h2 className="edu-title">{l.howItWorks.title}</h2>
            <p className="edu-desc">{l.howItWorks.desc}</p>
          </div>

          <div className="edu-timeline">
            <div className="edu-step">
              <div className="edu-step-num">1</div>
              <div className="edu-step-content">
                <h4>{l.howItWorks.s1Title}</h4>
                <p>{l.howItWorks.s1Text}</p>
              </div>
            </div>
            <div className="edu-step">
              <div className="edu-step-num">2</div>
              <div className="edu-step-content">
                <h4>{l.howItWorks.s2Title}</h4>
                <p>{l.howItWorks.s2Text}</p>
              </div>
            </div>
            <div className="edu-step">
              <div className="edu-step-num">3</div>
              <div className="edu-step-content">
                <h4>{l.howItWorks.s3Title}</h4>
                <p>{l.howItWorks.s3Text}</p>
              </div>
            </div>
            <div className="edu-step">
              <div className="edu-step-num">4</div>
              <div className="edu-step-content">
                <h4>{l.howItWorks.s4Title}</h4>
                <p>{l.howItWorks.s4Text}</p>
              </div>
            </div>
            <div className="edu-step">
              <div className="edu-step-num">5</div>
              <div className="edu-step-content">
                <h4>{l.howItWorks.s5Title}</h4>
                <p>{l.howItWorks.s5Text}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — PLATFORM FEATURES */}
      <section id="features" className="edu-section edu-section--cream">
        <div className="edu-container">
          <div className="edu-header">
            <span className="edu-badge">{l.features.badge}</span>
            <h2 className="edu-title">{l.features.title}</h2>
            <p className="edu-desc">{l.features.desc}</p>
          </div>

          <div className="edu-grid-3">
            <div className="edu-feature-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h3>{l.features.f1Title}</h3>
              <p>{l.features.f1Text}</p>
            </div>

            <div className="edu-feature-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>{l.features.f2Title}</h3>
              <p>{l.features.f2Text}</p>
            </div>

            <div className="edu-feature-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <h3>{l.features.f3Title}</h3>
              <p>{l.features.f3Text}</p>
            </div>

            <div className="edu-feature-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3>{l.features.f4Title}</h3>
              <p>{l.features.f4Text}</p>
            </div>

            <div className="edu-feature-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3>{l.features.f5Title}</h3>
              <p>{l.features.f5Text}</p>
            </div>

            <div className="edu-feature-card">
              <div className="edu-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3>{l.features.f6Title}</h3>
              <p>{l.features.f6Text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FOR TEACHERS */}
      <section id="for-teachers" className="edu-section edu-section--beige">
        <div className="edu-container">
          <div className="edu-split">
            <div className="edu-split-info">
              <span className="edu-badge">{l.teachers.badge}</span>
              <h2 className="edu-title">{l.teachers.title}</h2>
              <p className="edu-desc">{l.teachers.desc}</p>
              <ul className="edu-check-list">
                <li>
                  <strong>{l.teachers.b1Title}</strong> {l.teachers.b1Text}
                </li>
                <li>
                  <strong>{l.teachers.b2Title}</strong> {l.teachers.b2Text}
                </li>
                <li>
                  <strong>{l.teachers.b3Title}</strong> {l.teachers.b3Text}
                </li>
              </ul>
              <div className="edu-btn-group">
                <Link href="/login" className="edu-btn edu-btn--peach">
                  {l.teachers.loginBtn}
                </Link>
                <Link href="/tutorial" className="edu-btn edu-btn--white">
                  {l.teachers.tutorialBtn}
                </Link>
              </div>
            </div>

            <div className="edu-split-card">
              <div className="edu-demo-card">
                <div className="edu-demo-header">
                  <span className="edu-demo-tag">{l.teachers.demoScenario}</span>
                  <span className="edu-demo-role">{l.teachers.demoRole}</span>
                </div>
                <h4>{l.teachers.demoTitle}</h4>
                <div className="edu-demo-stats">
                  <div className="edu-demo-stat">
                    <span className="num">{l.teachers.stat1Val}</span>
                    <span className="lbl">{l.teachers.stat1Lbl}</span>
                  </div>
                  <div className="edu-demo-stat">
                    <span className="num">{l.teachers.stat2Val}</span>
                    <span className="lbl">{l.teachers.stat2Lbl}</span>
                  </div>
                  <div className="edu-demo-stat">
                    <span className="num">{l.teachers.stat3Val}</span>
                    <span className="lbl">{l.teachers.stat3Lbl}</span>
                  </div>
                </div>
                <div className="edu-demo-item">
                  <div className="edu-demo-item-title">{l.teachers.cohortTitle}</div>
                  <div className="edu-demo-progress">
                    <div className="edu-demo-bar" style={{ width: "78%" }} />
                  </div>
                  <div className="edu-demo-item-footer">
                    <span>{l.teachers.checkpoint}</span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{l.teachers.onTrack}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — FOR SCHOOL LEADERS */}
      <section id="for-principals" className="edu-section edu-section--cream">
        <div className="edu-container">
          <div className="edu-split edu-split--reverse">
            <div className="edu-split-info">
              <span className="edu-badge">{l.principals.badge}</span>
              <h2 className="edu-title">{l.principals.title}</h2>
              <p className="edu-desc">{l.principals.desc}</p>
              <ul className="edu-check-list">
                <li>
                  <strong>{l.principals.b1Title}</strong> {l.principals.b1Text}
                </li>
                <li>
                  <strong>{l.principals.b2Title}</strong> {l.principals.b2Text}
                </li>
                <li>
                  <strong>{l.principals.b3Title}</strong> {l.principals.b3Text}
                </li>
              </ul>
              <div className="edu-btn-group">
                <Link href="/login" className="edu-btn edu-btn--peach">
                  {l.principals.portalBtn}
                </Link>
              </div>
            </div>

            <div className="edu-split-card">
              <div className="edu-demo-card">
                <div className="edu-demo-header">
                  <span className="edu-demo-tag">{l.principals.demoScenario}</span>
                  <span className="edu-demo-role">{l.principals.demoRole}</span>
                </div>
                <h4>{l.principals.demoTitle}</h4>
                <div className="edu-demo-stats">
                  <div className="edu-demo-stat">
                    <span className="num">{l.principals.stat1Val}</span>
                    <span className="lbl">{l.principals.stat1Lbl}</span>
                  </div>
                  <div className="edu-demo-stat">
                    <span className="num">{l.principals.stat2Val}</span>
                    <span className="lbl">{l.principals.stat2Lbl}</span>
                  </div>
                  <div className="edu-demo-stat">
                    <span className="num">{l.principals.stat3Val}</span>
                    <span className="lbl">{l.principals.stat3Lbl}</span>
                  </div>
                </div>
                <div className="edu-demo-item">
                  <div className="edu-demo-item-title">{l.principals.cohortTitle}</div>
                  <div className="edu-demo-progress">
                    <div className="edu-demo-bar" style={{ width: "89%" }} />
                  </div>
                  <div className="edu-demo-item-footer">
                    <span>{l.principals.targetText}</span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{l.principals.achievedText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — CALL TO ACTION */}
      <section id="cta" className="edu-section edu-section--beige">
        <div className="edu-container">
          <div className="edu-cta-box">
            <span className="edu-badge" style={{ background: "#FFFFFF" }}>
              {l.cta.badge}
            </span>
            <h2 className="edu-cta-title">{l.cta.title}</h2>
            <p className="edu-cta-desc">{l.cta.desc}</p>
            <div className="edu-cta-buttons">
              <Link
                href="/dashboard"
                className="edu-btn edu-btn--peach"
                style={{ boxShadow: "0 6px 20px rgba(73,53,47,.16)" }}
              >
                {l.cta.primaryBtn}
              </Link>
              <Link href="/login" className="edu-btn edu-btn--white">
                {l.cta.secondaryBtn}
              </Link>
            </div>
            <div className="edu-trust-badges">
              <span>&#10003; {l.cta.t1}</span>
              <span>&bull;</span>
              <span>&#10003; {l.cta.t2}</span>
              <span>&bull;</span>
              <span>&#10003; {l.cta.t3}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FOOTER */}
      <footer className="edu-footer">
        <div className="edu-container">
          <div className="edu-footer-grid">
            <div className="edu-footer-brand">
              <div className="edu-footer-logo">
                <svg viewBox="0 0 22 24" aria-hidden="true" style={{ width: "22px", height: "24px", fill: "var(--color-peach)" }}>
                  <path d="M11 1.3c-2.1 0-3.95 1.2-4.75 2.95C3.95 4.55 2.3 6.25 2.3 8.35c0 2.3 1.9 4.2 4.3 4.2h8.8c2.4 0 4.3-1.9 4.3-4.2 0-2.1-1.65-3.8-4-4.1C14.95 2.5 13.1 1.3 11 1.3Z" />
                  <path d="M9.6 12.55h2.8v4.2c1.35.3 2.45 1.15 3.15 2.4-1.35.4-2.4.15-3.15-.4v4.15H9.6v-4.15c-.75.55-1.8.8-3.15.4.7-1.25 1.8-2.1 3.15-2.4v-4.2Z" />
                </svg>
                <span>{l.footer.brand}</span>
              </div>
              <p className="edu-footer-text">{l.footer.desc}</p>
            </div>

            <div className="edu-footer-col">
              <h5>{l.footer.colProduct}</h5>
              <ul>
                <li>
                  <a href="#hero">{l.footer.home}</a>
                </li>
                <li>
                  <a href="#how-it-works">{l.footer.howItWorks}</a>
                </li>
                <li>
                  <a href="#features">{l.footer.features}</a>
                </li>
                <li>
                  <Link href="/tutorial">{l.footer.tutorial}</Link>
                </li>
              </ul>
            </div>

            <div className="edu-footer-col">
              <h5>{l.footer.colWorkflows}</h5>
              <ul>
                <li>
                  <Link href="/login">{l.footer.teacherLogin}</Link>
                </li>
                <li>
                  <Link href="/login">{l.footer.principalPortal}</Link>
                </li>
                <li>
                  <Link href="/dashboard">{l.footer.dashboard}</Link>
                </li>
                <li>
                  <Link href="/assessments">{l.footer.assessments}</Link>
                </li>
              </ul>
            </div>

            <div className="edu-footer-col">
              <h5>{l.footer.colFrameworks}</h5>
              <ul>
                <li>
                  <a href="#challenge">{l.footer.flnStandards}</a>
                </li>
                <li>
                  <a href="#challenge">{l.footer.nipunBharat}</a>
                </li>
                <li>
                  <a href="#features">{l.footer.vernacularLearning}</a>
                </li>
                <li>
                  <a href="#features">{l.footer.edgeDiagnostics}</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="edu-footer-bottom">
            <p>{l.footer.copyright}</p>
            <p className="edu-footer-demo-note">{l.footer.demoNote}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
