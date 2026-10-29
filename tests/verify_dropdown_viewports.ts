import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 3005;
const CDP_PORT = 9222;

const VIEWPORTS = [
  { name: "1920px (Desktop wide)", width: 1920, height: 1080 },
  { name: "1440px (Desktop standard)", width: 1440, height: 900 },
  { name: "1366px (Common laptop)", width: 1366, height: 768 },
  { name: "1024px (Tablet landscape / small laptop)", width: 1024, height: 768 },
  { name: "768px (Tablet portrait)", width: 768, height: 1024 },
  { name: "390px (Mobile portrait)", width: 390, height: 844 },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url: string, timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 307 || res.status === 308) {
        return true;
      }
    } catch {
      // wait
    }
    await sleep(500);
  }
  return false;
}

class CDPClient {
  private ws: any;
  private id = 1;
  private callbacks = new Map<number, { resolve: Function; reject: Function }>();

  async connect(wsUrl: string) {
    const { WebSocket } = await import("ws" as any).catch(() => {
      return { WebSocket: (globalThis as any).WebSocket };
    });

    this.ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event: any) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id)!;
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  async send(method: string, params: any = {}): Promise<any> {
    const msgId = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async evaluate(expression: string): Promise<any> {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  close() {
    try {
      this.ws?.close();
    } catch {}
  }
}

async function main() {
  console.log("=== Viewport Layout & Account Dropdown Verification Suite ===");

  // 1. Generate real signed session token for teacher
  const sessionToken = await signSession({
    id: "usr_teacher_pooja",
    name: "Pooja Sharma",
    email: "teacher@studysaathi.edu.in",
    role: "teacher",
    schoolId: "sch_guj_042",
  });
  console.log("Generated valid teacher session token.");

  // 2. Start Next.js production server
  console.log(`Starting next server on port ${PORT}...`);
  const serverProc = spawn("npx.cmd", ["next", "start", "-p", String(PORT)], {
    stdio: "ignore",
    detached: false,
    shell: true,
  });

  const serverReady = await waitForServer(`http://127.0.0.1:${PORT}/dashboard`);
  if (!serverReady) {
    console.error("Failed to start Next.js server!");
    serverProc.kill();
    process.exit(1);
  }
  console.log("Next.js server is ready at http://127.0.0.1:" + PORT);

  // 3. Start Microsoft Edge Headless with CDP
  console.log("Launching Microsoft Edge Headless...");
  const edgeProc = spawn(
    EDGE_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${CDP_PORT}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `http://127.0.0.1:${PORT}/login`,
    ],
    { stdio: "ignore" }
  );

  const cdpReady = await waitForServer(`http://127.0.0.1:${CDP_PORT}/json/version`, 15000);
  if (!cdpReady) {
    console.error("Failed to connect to Edge CDP!");
    edgeProc.kill();
    serverProc.kill();
    process.exit(1);
  }

  const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const targets = (await targetsRes.json()) as any[];
  const pageTarget = targets.find((t) => t.type === "page" || t.url.includes(String(PORT)));
  if (!pageTarget) {
    console.error("No Edge page target found!");
    edgeProc.kill();
    serverProc.kill();
    process.exit(1);
  }

  console.log("Connected to Edge page target:", pageTarget.webSocketDebuggerUrl);
  const client = new CDPClient();
  await client.connect(pageTarget.webSocketDebuggerUrl);

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");

  // Set the authenticated session cookie
  await client.send("Network.setCookie", {
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });
  console.log("Injected authentication session cookie into Edge.");

  const results: any[] = [];
  const artifactsDir = "C:\\Users\\Raj\\.gemini\\antigravity\\brain\\756bca93-dd7c-42cf-82c7-00ca79183423";

  for (const vp of VIEWPORTS) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);

    // Override device metrics
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768,
    });

    // Navigate to /dashboard
    await client.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/dashboard` });
    await sleep(2500);

    // Click the account dropdown button
    const openResult = await client.evaluate(`
      (() => {
        const btn = document.querySelector('button[aria-label="Account Center and Role Switcher"]') 
                 || document.querySelector('header button[aria-haspopup="true"]');
        if (!btn) {
          return { error: "Account button not found", pathname: window.location.pathname };
        }
        btn.click();
        return { clicked: true, pathname: window.location.pathname };
      })()
    `);

    await sleep(600);

    // Measure layout metrics
    const metrics = await client.evaluate(`
      (() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const hasHorizontalScroll = scrollWidth > docWidth;

        const dropdown = document.getElementById("account-dropdown");
        if (!dropdown) {
          return { error: "Dropdown not rendered", docWidth, scrollWidth, pathname: window.location.pathname };
        }

        const rect = dropdown.getBoundingClientRect();
        const header = document.querySelector("header");
        const headerRect = header ? header.getBoundingClientRect() : null;

        // Check menu items
        const menuButtons = Array.from(dropdown.querySelectorAll("button"));
        const items = menuButtons.map(b => b.innerText.split("\\n")[0].trim());

        return {
          viewportWidth: window.innerWidth,
          docWidth,
          scrollWidth,
          hasHorizontalScroll,
          headerWidth: headerRect ? Math.round(headerRect.width) : null,
          dropdown: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isFullyVisible: rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0,
            marginRight: Math.round(window.innerWidth - rect.right),
            marginLeft: Math.round(rect.left)
          },
          items
        };
      })()
    `);

    console.log("Metrics:", JSON.stringify(metrics, null, 2));

    // Capture screenshot for visual verification
    const screenshot = await client.send("Page.captureScreenshot", { format: "png" });
    const screenshotPath = path.join(artifactsDir, `dropdown-viewport-${vp.width}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
    console.log(`Saved screenshot: ${screenshotPath}`);

    results.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      ...metrics,
    });
  }

  client.close();
  edgeProc.kill();
  serverProc.kill();

  console.log("\n=================== ALL VIEWPORTS TEST RESULTS SUMMARY ===================");
  console.table(
    results.map((r) => ({
      Viewport: r.viewport,
      "Scroll Width": r.scrollWidth,
      "Doc Width": r.docWidth,
      "H-Overflow?": r.hasHorizontalScroll ? "FAIL" : "PASS (0px)",
      "Dropdown Left": r.dropdown?.left,
      "Dropdown Right": r.dropdown?.right,
      "Dropdown Width": r.dropdown?.width,
      "Safe Margin Right": r.dropdown?.marginRight + "px",
      "Safe Margin Left": r.dropdown?.marginLeft + "px",
      "Inside Viewport?": r.dropdown?.isFullyVisible ? "PASS (100% In View)" : "FAIL",
    }))
  );

  const allPassed = results.every(
    (r) => !r.hasHorizontalScroll && r.dropdown?.isFullyVisible
  );
  if (allPassed) {
    console.log("\n SUCCESS: All 6 viewports PASSED with ZERO horizontal overflow and 100% dropdown visibility!");
  } else {
    console.error("\n FAILURE: Some viewports failed checks.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
