import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { FilterProvider } from "@/context/FilterContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TutorialProvider } from "@/context/TutorialContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F1E1" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1614" },
  ],
};

export const metadata: Metadata = {
  applicationName: "StudySaathi AI",
  title: "StudySaathi AI | Pedagogical Remedial System & Learning Gap Intelligence",
  description:
    "Deterministic rule-based tracking, explainable cognitive diagnosis, and concrete 5-step remedial curricula for primary schools.",
  keywords: ["StudySaathi", "learning gaps", "remedial education", "primary schools", "offline-first", "pedagogy"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "StudySaathi AI | Pedagogical Remedial System",
    description: "Every Child Can Learn. AI Helps Us Find the Way. Smart tracking and remedial action system for primary schools.",
    siteName: "StudySaathi AI",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('studysaathi_theme') || localStorage.getItem('shikshasetu_theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored === 'dark' || ((!stored || stored === 'system') && prefersDark);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                    root.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#F4F1E1] text-[#49352F] dark:bg-[#1B1614] dark:text-[#F4F1E1] antialiased font-sans transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <FilterProvider>
                <TutorialProvider>{children}</TutorialProvider>
              </FilterProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
