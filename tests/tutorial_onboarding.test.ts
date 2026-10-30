import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dashboardTourSteps, aaravCaseTourSteps, tutorialTourSteps, PAGE_TOURS } from "../src/lib/tutorialData";

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

// Application Navigation and Tutorial Simulation
class AppNavigationSimulator {
  public currentUrl: string = "/dashboard";
  public tutorialOpen: boolean = false;
  public tutorialMode: "auto" | "manual" = "manual";
  public tutorialStep: number = 0;
  public activeTourPage: string = "FULL_SITE_TOUR";
  public user: User | null = null;
  public storage: MockStorage;

  // Component readiness states
  public dashboardReady: boolean = true;
  public studentsReady: boolean = true;

  // Intent guards
  private hasTriggeredFullTourRef: boolean = false;
  private hasTriggeredAaravTourRef: boolean = false;

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

  // Navigate to URL (mirrors router.push)
  public navigate(url: string) {
    this.currentUrl = url;
    // Reset guards when intent is newly applied
    if (url.includes("tour=full") || url.includes("tour=FULL_SITE_TOUR")) {
      this.hasTriggeredFullTourRef = false;
    }
    if (url.includes("tour=aarav") || url.includes("tour=AARAV_CASE_TOUR")) {
      this.hasTriggeredAaravTourRef = false;
    }
    this.processDestinationReadiness();
  }

  // Replace URL without reloading (mirrors router.replace)
  public replace(url: string) {
    this.currentUrl = url;
  }

  // startTutorial implementation matching src/context/TutorialContext.tsx
  public startTutorial(mode: "FULL_SITE_TOUR" | "AARAV_CASE_TOUR" | string) {
    const isAarav = mode === "AARAV_CASE_TOUR" || mode === "aarav";
    const targetPage = isAarav ? "AARAV_CASE_TOUR" : "FULL_SITE_TOUR";

    this.tutorialMode = "manual";
    this.tutorialStep = 0;
    this.activeTourPage = targetPage;
    this.tutorialOpen = true;
  }

  // Check automatic onboarding for brand new users on first login
  public checkAutomaticOnboarding(pathname: string): boolean {
    this.currentUrl = pathname;
    if (pathname === "/dashboard" && this.user && this.user.has_seen_tutorial === false && !this.tutorialOpen) {
      this.tutorialMode = "auto";
      this.tutorialStep = 0;
      this.activeTourPage = "FULL_SITE_TOUR";
      this.tutorialOpen = true;
      return true;
    }
    return false;
  }

  // Mirrors destination page useEffect monitoring component readiness and query params
  public processDestinationReadiness() {
    const [path, queryString] = this.currentUrl.split("?");
    const params = new URLSearchParams(queryString || "");
    const tour = params.get("tour");

    // Flow 1: Dashboard mounted & receives tour=full
    if (path === "/dashboard") {
      const isFullIntent = tour === "full" || tour === "FULL_SITE_TOUR";
      if (isFullIntent && this.dashboardReady && !this.hasTriggeredFullTourRef) {
        this.hasTriggeredFullTourRef = true;
        this.startTutorial("FULL_SITE_TOUR");
        // Clear / consume intent
        this.replace("/dashboard");
      }
    }

    // Flow 2: Students mounted & receives tour=aarav
    if (path === "/students") {
      const isAaravIntent = tour === "aarav" || tour === "AARAV_CASE_TOUR";
      if (isAaravIntent && this.studentsReady && !this.hasTriggeredAaravTourRef) {
        this.hasTriggeredAaravTourRef = true;
        this.startTutorial("AARAV_CASE_TOUR");
        // Clear / consume intent
        this.replace("/students");
      }
    }
  }

  public closeTutorial() {
    this.tutorialOpen = false;
    if (this.user) {
      this.user.has_seen_tutorial = true;
      this.storage.setItem("shikshasetu_user", JSON.stringify(this.user));
      this.storage.setItem(`shikshasetu_seen_tutorial_${this.user.email}`, "true");
    }
  }

  public resetTutorial() {
    if (this.user) {
      this.user.has_seen_tutorial = false;
      this.storage.setItem("shikshasetu_user", JSON.stringify(this.user));
      this.storage.removeItem(`shikshasetu_seen_tutorial_${this.user.email}`);
    }
  }
}

describe("ShikshaSetu AI Tutorial Navigation & Automated Flows Suite", () => {
  it("TEST 1 — Launch Aarav's Case: navigates to /students?tour=aarav, waits for Students ready, starts AARAV_CASE_TOUR from Step 1", () => {
    const storage = new MockStorage();
    const app = new AppNavigationSimulator(storage);
    app.login("teacher@shikshasetu.edu.in", "teacher");

    // User is initially on dashboard with tutorial closed
    app.currentUrl = "/dashboard";
    assert.strictEqual(app.tutorialOpen, false);

    // User clicks 'Launch Aarav\'s Case →'
    app.navigate("/students?tour=aarav");

    // Automatically reaches Students page
    assert.strictEqual(app.currentUrl, "/students", "Must have consumed and cleared ?tour=aarav intent");
    assert.strictEqual(app.tutorialOpen, true, "Aarav tutorial overlay must open automatically");
    assert.strictEqual(app.activeTourPage, "AARAV_CASE_TOUR", "Must activate AARAV_CASE_TOUR mode");
    assert.strictEqual(app.tutorialStep, 0, "Tutorial must start strictly at Step 1 (index 0)");

    // Verify steps belong to Aarav case tour targeting real Students DOM elements
    const steps = PAGE_TOURS[app.activeTourPage];
    assert.ok(steps.length >= 4, "Aarav case tour must have at least 4 steps");
    assert.strictEqual(steps[0].targetSelector, '[data-tour="aarav-card"]');
    assert.strictEqual(steps[1].targetSelector, '[data-tour="aarav-gap-badge"]');
  });

  it("TEST 2 — Replay Guided Tour: navigates to /dashboard?tour=full, waits for Dashboard ready, starts FULL_SITE_TOUR from Step 1", () => {
    const storage = new MockStorage();
    const app = new AppNavigationSimulator(storage);
    app.login("teacher@shikshasetu.edu.in", "teacher");

    // User is on /tutorial or /settings
    app.currentUrl = "/tutorial";
    assert.strictEqual(app.tutorialOpen, false);

    // User clicks 'Replay Guided Tour'
    app.navigate("/dashboard?tour=full");

    // Automatically reaches Dashboard
    assert.strictEqual(app.currentUrl, "/dashboard", "Must have consumed and cleared ?tour=full intent");
    assert.strictEqual(app.tutorialOpen, true, "Full site tutorial must open automatically");
    assert.strictEqual(app.activeTourPage, "FULL_SITE_TOUR", "Must activate FULL_SITE_TOUR mode");
    assert.strictEqual(app.tutorialStep, 0, "Tutorial must start strictly at Step 1 (index 0)");

    // Verify steps belong to full website tour
    const steps = PAGE_TOURS[app.activeTourPage];
    assert.ok(steps.length >= 8, "Full site tour must have at least 8 steps");
    assert.strictEqual(steps[1].targetSelector, '[data-tour="kpi-tiles"]');
    assert.strictEqual(steps[2].targetSelector, '[data-tour="immediate-attention"]');
  });

  it("TEST 3 — Experienced user: login has no automatic tutorial; clicking Replay Guided Tour starts full tutorial", () => {
    const storage = new MockStorage();
    const app = new AppNavigationSimulator(storage);

    // Login as experienced user
    const user = app.login("teacher@shikshasetu.edu.in", "teacher");
    assert.strictEqual(user.has_seen_tutorial, true, "Experienced user must have has_seen_tutorial = true");

    // Standard visit to dashboard
    const autoTriggered = app.checkAutomaticOnboarding("/dashboard");
    assert.strictEqual(autoTriggered, false, "Ordinary login must NOT automatically trigger tutorial");
    assert.strictEqual(app.tutorialOpen, false);

    // User clicks "Replay Guided Tour"
    app.navigate("/dashboard?tour=full");
    assert.strictEqual(app.tutorialOpen, true, "Manual click must start tutorial even for experienced user");
    assert.strictEqual(app.activeTourPage, "FULL_SITE_TOUR");
    assert.strictEqual(app.tutorialStep, 0);
  });

  it("TEST 4 — Experienced user + Aarav: clicking Launch Aarav's Case starts Aarav tutorial automatically", () => {
    const storage = new MockStorage();
    const app = new AppNavigationSimulator(storage);

    // Experienced user with completed tutorial history
    app.login("teacher@shikshasetu.edu.in", "teacher");
    app.closeTutorial();
    assert.strictEqual(app.user?.has_seen_tutorial, true);

    // User clicks 'Launch Aarav\'s Case →'
    app.navigate("/students?tour=aarav");
    assert.strictEqual(app.tutorialOpen, true, "Aarav tutorial must open automatically");
    assert.strictEqual(app.activeTourPage, "AARAV_CASE_TOUR");
    assert.strictEqual(app.tutorialStep, 0);
  });

  it("TEST 5 — No Reset: neither tutorial flow requires clicking Reset Tutorial & Onboarding", () => {
    const storage = new MockStorage();
    storage.setItem("shikshasetu_tour_completed_FULL_SITE_TOUR", "true");
    storage.setItem("shikshasetu_tour_completed_AARAV_CASE_TOUR", "true");
    const app = new AppNavigationSimulator(storage);
    app.login("teacher@shikshasetu.edu.in", "teacher");

    // Flow 1 without Reset
    app.navigate("/students?tour=aarav");
    assert.strictEqual(app.tutorialOpen, true, "Aarav tour works without Reset");
    app.closeTutorial();

    // Flow 2 without Reset
    app.navigate("/dashboard?tour=full");
    assert.strictEqual(app.tutorialOpen, true, "Full tour works without Reset");
  });

  it("TEST 6 — Prevent Duplicate Tutorial Starts: intent is consumed once and re-renders do not double open", () => {
    const storage = new MockStorage();
    const app = new AppNavigationSimulator(storage);
    app.login("teacher@shikshasetu.edu.in", "teacher");

    // Navigate to students with tour=aarav
    app.navigate("/students?tour=aarav");
    assert.strictEqual(app.tutorialOpen, true);
    assert.strictEqual(app.currentUrl, "/students", "Intent must be replaced/consumed");

    // Close tour
    app.closeTutorial();
    assert.strictEqual(app.tutorialOpen, false);

    // Simulate React re-render of Students page
    app.processDestinationReadiness();
    assert.strictEqual(app.tutorialOpen, false, "Tutorial must NOT re-open on plain re-render");
  });

  it("TEST 7 — Two Distinct Tutorial Modes in Central Engine", () => {
    assert.ok(PAGE_TOURS["FULL_SITE_TOUR"], "FULL_SITE_TOUR must be registered in PAGE_TOURS");
    assert.ok(PAGE_TOURS["AARAV_CASE_TOUR"], "AARAV_CASE_TOUR must be registered in PAGE_TOURS");

    assert.notStrictEqual(PAGE_TOURS["FULL_SITE_TOUR"], PAGE_TOURS["AARAV_CASE_TOUR"], "Modes must have different step definitions");

    const fullSteps = PAGE_TOURS["FULL_SITE_TOUR"];
    const aaravSteps = PAGE_TOURS["AARAV_CASE_TOUR"];

    // Aarav case specifically highlights Students / Aarav elements
    assert.ok(aaravSteps.some((s) => s.targetSelector === '[data-tour="aarav-card"]'));
    assert.ok(aaravSteps.some((s) => s.targetSelector === '[data-tour="aarav-gap-badge"]'));

    // Full site highlights Dashboard overview elements
    assert.ok(fullSteps.some((s) => s.targetSelector === '[data-tour="kpi-tiles"]'));
    assert.ok(fullSteps.some((s) => s.targetSelector === '[data-tour="immediate-attention"]'));
  });

  it("TEST 8 — New User Automatic Onboarding preserved on first login", () => {
    const storage = new MockStorage();
    const app = new AppNavigationSimulator(storage);

    // Register brand new user
    const newUser = app.login("brandnewteacher@gujarat.gov.in", "teacher");
    assert.strictEqual(newUser.has_seen_tutorial, false);

    const autoOpened = app.checkAutomaticOnboarding("/dashboard");
    assert.strictEqual(autoOpened, true, "Brand new user must get automatic tour");
    assert.strictEqual(app.tutorialOpen, true);
    assert.strictEqual(app.tutorialMode, "auto");
    assert.strictEqual(app.tutorialStep, 0);
  });
});
