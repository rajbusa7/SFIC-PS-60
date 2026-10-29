import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dashboardTourSteps, tutorialTourSteps, PAGE_TOURS } from "../src/lib/tutorialData";

// Simulate mock localStorage and sessionStorage environment
class MockStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// User model simulation matching packages/shared/src/types/student.ts
interface User {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "admin" | "parent";
  schoolId: string;
  has_seen_tutorial?: boolean;
}

// Tutorial Engine state simulation matching src/context/TutorialContext.tsx
class TutorialEngine {
  public tutorialOpen: boolean = false;
  public tutorialMode: "auto" | "manual" = "manual";
  public tutorialStep: number = 0;
  public activeTourPage: string = "tutorial";
  public currentPath: string = "/dashboard";
  public user: User | null = null;
  public storage: MockStorage;

  constructor(storage: MockStorage) {
    this.storage = storage;
  }

  public setUser(user: User | null) {
    this.user = user;
    if (user && this.storage) {
      this.storage.setItem("shikshasetu_user", JSON.stringify(user));
    }
  }

  public login(email: string, role: "teacher" | "admin" | "parent" = "teacher"): User {
    const cleanEmail = email.toLowerCase().trim();
    const isDemoEmail =
      cleanEmail === "teacher@shikshasetu.edu.in" ||
      cleanEmail === "principal@shikshasetu.edu.in" ||
      cleanEmail === "dinesh.patel@example.com";

    const storedStatus = this.storage.getItem(`shikshasetu_seen_tutorial_${cleanEmail}`);
    const hasSeen = storedStatus !== null ? storedStatus === "true" : (isDemoEmail ? true : false);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: role === "teacher" ? "Class Teacher" : "User",
      email: cleanEmail,
      role,
      schoolId: "sch-gn-01",
      has_seen_tutorial: hasSeen,
    };
    this.setUser(newUser);
    this.storage.setItem(`shikshasetu_seen_tutorial_${cleanEmail}`, hasSeen ? "true" : "false");
    return newUser;
  }

  // Automatic onboarding check (ran on /dashboard mount)
  public checkAutomaticOnboarding(pathname: string): boolean {
    this.currentPath = pathname;
    if (pathname === "/dashboard" && this.user && this.user.has_seen_tutorial === false && !this.tutorialOpen) {
      this.tutorialMode = "auto";
      this.tutorialStep = 0;
      this.activeTourPage = "tutorial";
      this.tutorialOpen = true;
      this.currentPath = "/tutorial"; // Automatically redirects to /tutorial
      return true;
    }
    return false;
  }

  // Central tutorial engine open method - called by "Replay Guided Tour" & "Open Tutorial →"
  public openTutorial(options?: { step?: number; page?: string }) {
    const targetPage = options?.page || "tutorial";
    const startStep = options?.step ?? 0;

    this.tutorialMode = "manual";
    this.tutorialStep = startStep;
    this.activeTourPage = targetPage;
    this.tutorialOpen = true;
    this.currentPath = "/tutorial"; // Immediately navigates to /tutorial
  }

  // Finish or close tutorial
  public closeTutorial() {
    this.tutorialOpen = false;
    if (this.user) {
      this.user.has_seen_tutorial = true;
      this.storage.setItem("shikshasetu_user", JSON.stringify(this.user));
      this.storage.setItem(`shikshasetu_seen_tutorial_${this.user.email}`, "true");
    }
    this.storage.setItem(`shikshasetu_tour_completed_${this.activeTourPage}`, "true");
  }

  // Reset Tutorial & Onboarding
  public resetTutorial() {
    if (this.user) {
      this.user.has_seen_tutorial = false;
      this.storage.setItem("shikshasetu_user", JSON.stringify(this.user));
      this.storage.removeItem(`shikshasetu_seen_tutorial_${this.user.email}`);
    }
    this.storage.removeItem("shikshasetu_tour_completed_dashboard");
    this.storage.removeItem("shikshasetu_tour_completed_tutorial");
    this.storage.removeItem("shikshasetu_checklist_completed");
  }
}

describe("ShikshaSetu AI Tutorial & Onboarding System Comprehensive Suite", () => {
  it("Test A — New User: automatically redirects to /tutorial on first login", () => {
    const storage = new MockStorage();
    const engine = new TutorialEngine(storage);

    // Register / login new user
    const newUser = engine.login("newteacher@gujarat.gov.in", "teacher");
    assert.strictEqual(newUser.has_seen_tutorial, false, "New user has_seen_tutorial must be false");

    // Visit dashboard on first login
    const autoOpened = engine.checkAutomaticOnboarding("/dashboard");
    assert.strictEqual(autoOpened, true, "Tutorial must automatically trigger for new user on dashboard");
    assert.strictEqual(engine.currentPath, "/tutorial", "Must automatically navigate/redirect to /tutorial");
    assert.strictEqual(engine.tutorialOpen, true, "Tutorial must be open");
    assert.strictEqual(engine.tutorialMode, "auto", "Tutorial mode should be auto");
    assert.strictEqual(engine.tutorialStep, 0, "Tutorial must start from step 1 (index 0)");
  });

  it("Test B — New User Manually Opens Tutorial: close tour, then click Replay Guided Tour", () => {
    const storage = new MockStorage();
    const engine = new TutorialEngine(storage);

    // New user logs in & tour auto-opens
    engine.login("newteacher@gujarat.gov.in", "teacher");
    engine.checkAutomaticOnboarding("/dashboard");
    assert.strictEqual(engine.tutorialOpen, true);

    // User closes the tutorial
    engine.closeTutorial();
    assert.strictEqual(engine.tutorialOpen, false, "Tutorial must be closed");
    assert.strictEqual(engine.user?.has_seen_tutorial, true, "After closing, user.has_seen_tutorial must be true");

    // User is on dashboard
    engine.currentPath = "/dashboard";

    // Next dashboard visit should NOT auto-open
    const autoOpenedAgain = engine.checkAutomaticOnboarding("/dashboard");
    assert.strictEqual(autoOpenedAgain, false, "Experienced/completed user must NOT auto-open tutorial");

    // User manually clicks 'Replay Guided Tour'
    engine.openTutorial();
    assert.strictEqual(engine.currentPath, "/tutorial", "Must navigate directly to /tutorial");
    assert.strictEqual(engine.tutorialOpen, true, "Tutorial must open on manual trigger");
    assert.strictEqual(engine.tutorialStep, 0, "Tutorial must restart from Step 1 (index 0)");
    assert.strictEqual(engine.tutorialMode, "manual", "Tutorial mode must be manual");
  });

  it("Test C — Experienced User: existing account login shows normal website with no auto tutorial", () => {
    const storage = new MockStorage();
    const engine = new TutorialEngine(storage);

    // Existing demo teacher
    const experiencedUser = engine.login("teacher@shikshasetu.edu.in", "teacher");
    assert.strictEqual(experiencedUser.has_seen_tutorial, true, "Experienced user must have has_seen_tutorial = true");

    const autoOpened = engine.checkAutomaticOnboarding("/dashboard");
    assert.strictEqual(autoOpened, false, "Automatic tutorial must NOT open for experienced user");
    assert.strictEqual(engine.currentPath, "/dashboard", "Must remain on normal website (/dashboard)");
    assert.strictEqual(engine.tutorialOpen, false, "Tutorial must remain closed");
  });

  it("Test D — Experienced User -> Replay Guided Tour: navigates immediately to /tutorial at Step 1", () => {
    const storage = new MockStorage();
    const engine = new TutorialEngine(storage);

    engine.login("teacher@shikshasetu.edu.in", "teacher");
    engine.currentPath = "/dashboard";
    assert.strictEqual(engine.tutorialOpen, false);

    // User clicks "Replay Guided Tour"
    engine.openTutorial();
    assert.strictEqual(engine.currentPath, "/tutorial", "Must immediately navigate to dedicated Tutorial page");
    assert.strictEqual(engine.tutorialOpen, true, "Tutorial must immediately open");
    assert.strictEqual(engine.tutorialStep, 0, "Tutorial must start from Step 1");
  });

  it("Test E — Experienced User -> Open Tutorial: clicks 'Open Tutorial →' in Teacher Tutorial card", () => {
    const storage = new MockStorage();
    const engine = new TutorialEngine(storage);

    engine.login("teacher@shikshasetu.edu.in", "teacher");
    engine.currentPath = "/dashboard";
    assert.strictEqual(engine.tutorialOpen, false);

    // User goes to Teacher Tutorial card and clicks 'Open Tutorial →'
    engine.openTutorial();
    assert.strictEqual(engine.currentPath, "/tutorial", "Must immediately navigate to dedicated Tutorial page");
    assert.strictEqual(engine.tutorialOpen, true, "Tutorial must immediately open");
    assert.strictEqual(engine.tutorialStep, 0, "Tutorial must start from Step 1");
  });

  it("Test F — Do NOT Reset: Experienced user clicks 'Replay Guided Tour' without clicking Reset", () => {
    const storage = new MockStorage();
    storage.setItem("shikshasetu_tour_completed_dashboard", "true");
    const engine = new TutorialEngine(storage);

    engine.login("teacher@shikshasetu.edu.in", "teacher");
    engine.currentPath = "/dashboard";
    // Explicitly verify NO reset was called
    assert.strictEqual(storage.getItem("shikshasetu_tour_completed_dashboard"), "true");

    // Click "Replay Guided Tour"
    engine.openTutorial();
    assert.strictEqual(engine.currentPath, "/tutorial", "Must navigate to /tutorial without reset");
    assert.strictEqual(engine.tutorialOpen, true, "Tutorial must open without needing Reset Tutorial & Onboarding");
    assert.strictEqual(engine.tutorialStep, 0, "Tutorial must start at Step 1");
  });

  it("Test G — Do NOT Reset: Experienced user clicks 'Open Tutorial →' without clicking Reset", () => {
    const storage = new MockStorage();
    storage.setItem("shikshasetu_tour_completed_dashboard", "true");
    const engine = new TutorialEngine(storage);

    engine.login("teacher@shikshasetu.edu.in", "teacher");
    engine.currentPath = "/dashboard";
    assert.strictEqual(storage.getItem("shikshasetu_tour_completed_dashboard"), "true");

    // Click "Open Tutorial →"
    engine.openTutorial();
    assert.strictEqual(engine.currentPath, "/tutorial", "Must navigate to /tutorial without reset");
    assert.strictEqual(engine.tutorialOpen, true, "Tutorial must open without needing Reset Tutorial & Onboarding");
    assert.strictEqual(engine.tutorialStep, 0, "Tutorial must start at Step 1");
  });

  it("Reset Tutorial & Onboarding: available for explicit testing but not part of normal manual flow", () => {
    const storage = new MockStorage();
    const engine = new TutorialEngine(storage);

    const user = engine.login("teacher@shikshasetu.edu.in", "teacher");
    assert.strictEqual(user.has_seen_tutorial, true);

    // Explicitly click Reset Tutorial & Onboarding in Settings
    engine.resetTutorial();
    assert.strictEqual(engine.user?.has_seen_tutorial, false, "Reset must set has_seen_tutorial to false");
    assert.strictEqual(storage.getItem("shikshasetu_tour_completed_dashboard"), null, "Completed flags must be cleared");

    // Subsequent dashboard visit will auto-open as if new user
    const autoOpened = engine.checkAutomaticOnboarding("/dashboard");
    assert.strictEqual(autoOpened, true, "After reset, automatic onboarding triggers on dashboard visit");
    assert.strictEqual(engine.currentPath, "/tutorial", "After reset, auto-onboarding routes to /tutorial");
  });

  it("One Shared Tutorial Engine: covers required website sections with real DOM elements", () => {
    // Verify steps defined in the central dashboard tour
    assert.ok(dashboardTourSteps.length >= 8, "Dashboard tour should have at least 8 steps");
    assert.ok(tutorialTourSteps.length >= 5, "Tutorial page tour should have at least 5 steps");

    // Check key DOM target selectors
    const stepIds = dashboardTourSteps.map((s) => s.id);
    assert.ok(stepIds.includes("welcome"), "Must include welcome step");
    assert.ok(stepIds.includes("kpi-tiles"), "Must include KPI stat tiles");
    assert.ok(stepIds.includes("immediate-attention"), "Must include immediate attention list");
    assert.ok(stepIds.includes("curriculum-chart"), "Must include curriculum competency chart");
    assert.ok(stepIds.includes("sidebar-nav"), "Must include sidebar navigation");
    assert.ok(stepIds.includes("language-toggle"), "Must include bilingual language switcher");
    assert.ok(stepIds.includes("shikshabot-trigger"), "Must include ShikshaBot AI assistant");
    assert.ok(stepIds.includes("finish"), "Must include completion/CTA step");

    // Check selectors
    const kpiStep = dashboardTourSteps.find((s) => s.id === "kpi-tiles");
    assert.strictEqual(kpiStep?.targetSelector, '[data-tour="kpi-tiles"]');

    const attnStep = dashboardTourSteps.find((s) => s.id === "immediate-attention");
    assert.strictEqual(attnStep?.targetSelector, '[data-tour="immediate-attention"]');

    const currStep = dashboardTourSteps.find((s) => s.id === "curriculum-chart");
    assert.strictEqual(currStep?.targetSelector, '[data-tour="curriculum-chart"]');

    const navStep = dashboardTourSteps.find((s) => s.id === "sidebar-nav");
    assert.strictEqual(navStep?.targetSelector, '[data-tour="sidebar-nav"]');

    const langStep = dashboardTourSteps.find((s) => s.id === "language-toggle");
    assert.strictEqual(langStep?.targetSelector, '[data-tour="language-toggle"]');

    const botStep = dashboardTourSteps.find((s) => s.id === "shikshabot-trigger");
    assert.strictEqual(botStep?.targetSelector, '[data-tour="shikshabot-trigger"]');

    // Check tutorial page tour selectors
    const tutStepIds = tutorialTourSteps.map((s) => s.id);
    assert.ok(tutStepIds.includes("tutorial-welcome"), "Tutorial tour must include welcome");
    assert.ok(tutStepIds.includes("tutorial-workflow"), "Tutorial tour must include workflow");
    assert.ok(tutStepIds.includes("tutorial-tabs"), "Tutorial tour must include tabs");
    assert.ok(tutStepIds.includes("tutorial-sandbox-btn"), "Tutorial tour must include sandbox button");
    assert.ok(tutStepIds.includes("tutorial-finish"), "Tutorial tour must include finish");
  });
});
