import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Hero Section - Large Stylish StudySaathi AI Brand Verification Suite", async (t) => {
  const html = fs.readFileSync("public/landing-pages/inner-green-3d.html", "utf8");

  await t.test("1. Hero content block contains large brand wordmark above platform label and headline", () => {
    const brandIdx = html.indexOf('class="hero-brand');
    const badgeIdx = html.indexOf('class="hero-badge');
    const headlineIdx = html.indexOf('class="headline"');
    const ledeIdx = html.indexOf('class="lede');
    const actionsIdx = html.indexOf('class="hero-actions');

    assert.ok(brandIdx > -1, "Hero brand wordmark must be present");
    assert.ok(badgeIdx > -1, "Hero platform badge must be present");
    assert.ok(headlineIdx > -1, "Main headline must be present");
    assert.ok(ledeIdx > -1, "Lede description must be present");
    assert.ok(actionsIdx > -1, "Hero action buttons must be present");

    // Strict document flow order verification:
    // 1. Brand Wordmark -> 2. Platform Label -> 3. Headline -> 4. Description -> 5. CTA Buttons
    assert.ok(brandIdx < badgeIdx, "Brand wordmark must precede the platform label");
    assert.ok(badgeIdx < headlineIdx, "Platform label must precede the main headline");
    assert.ok(headlineIdx < ledeIdx, "Main headline must precede the descriptive paragraph");
    assert.ok(ledeIdx < actionsIdx, "Descriptive paragraph must precede the action buttons");
  });

  await t.test("2. Wordmark renders STUDYSAATHI in dark chocolate brown and AI in warm peach-orange", () => {
    assert.ok(html.includes("hero-brand-study"), "Must define hero-brand-study class");
    assert.ok(html.includes("hero-brand-ai"), "Must define hero-brand-ai class");
    assert.ok(
      html.includes("color:var(--color-text-brown)") || html.includes("color:#49352F"),
      "STUDYSAATHI must be dark chocolate brown"
    );
    assert.ok(
      html.includes("color:#B26A1B"),
      "AI must feature warm burnt peach-orange accent (#B26A1B)"
    );
  });

  await t.test("3. Desktop font size is approximately 48-60px with bold font-weight (800/850)", () => {
    assert.ok(
      html.includes("60px") && html.includes("hero-brand-text"),
      "Desktop font size scaling must reach up to 60px (48-60px range)"
    );
    assert.ok(
      html.includes("font-weight:800") || html.includes("font-weight: 800"),
      "Font weight must be 800"
    );
    assert.ok(
      html.includes("font-weight:850") || html.includes("font-weight: 850"),
      "AI accent font weight must be 850"
    );
  });

  await t.test("4. Subtle details: Botanical tree SVG icon and accent underline on AI", () => {
    assert.ok(
      html.includes("hero-brand-mark"),
      "Must include brand mark SVG container beside wordmark"
    );
    assert.ok(
      html.includes("M11 1.3c-2.1 0-3.95 1.2-4.75 2.95"),
      "Must use botanical tree education SVG logo"
    );
    assert.ok(
      html.includes("hero-brand-ai-line"),
      "Must include subtle accent underline beneath AI"
    );
  });

  await t.test("5. Staged entrance animation fits existing system using .fade", () => {
    assert.ok(
      html.includes('class="hero-brand fade" style="--d:120ms"'),
      "Brand must use existing .fade class staged at 120ms entrance timing"
    );
  });

  await t.test("6. Responsive typography rules for tablet (max-width:900px) and mobile (max-width:540px)", () => {
    const tabletSection = html.slice(html.indexOf("@media (max-width:900px)"));
    assert.ok(
      tabletSection.includes(".hero-brand"),
      "Tablet media query must include hero-brand responsiveness"
    );

    const mobileSection = html.slice(html.indexOf("@media (max-width:540px)"));
    assert.ok(
      mobileSection.includes(".hero-brand"),
      "Mobile media query must include hero-brand styling"
    );
    assert.ok(
      mobileSection.includes("clamp(24px") || mobileSection.includes("clamp(26px"),
      "Mobile typography must scale smoothly to ~30-36px"
    );
  });

  await t.test("7. Preservation: Headline, description, CTA buttons, and 3D stage remain intact", () => {
    assert.ok(html.includes("Every Child Can Learn."), "Headline line 1 preserved");
    assert.ok(html.includes("AI Helps Us Find the Way."), "Headline line 2 preserved");
    assert.ok(
      html.includes("Identify learning gaps early, understand each student's needs"),
      "Lede description preserved"
    );
    assert.ok(html.includes("Explore the Platform"), "Explore platform button preserved");
    assert.ok(html.includes("Teacher Login"), "Teacher login button preserved");
    assert.ok(html.includes('class="liquid-button liquid-button--play btn"'), "Play button preserved");
    assert.ok(html.includes('id="scene"'), "3D Canvas scene preserved");
  });

  await t.test("8. Zero emojis across the entire landing page markup", () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const lines = html.split("\n");
    const emojiLines: string[] = [];
    lines.forEach((line, idx) => {
      if (emojiRegex.test(line)) {
        emojiLines.push(`Line ${idx + 1}: ${line.trim()}`);
      }
    });
    assert.deepEqual(emojiLines, [], "Landing page must contain strictly zero emojis");
  });
});

