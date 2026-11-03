import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("StudySaathi AI - Premium Brand Identity & Navbar Verification", async (t) => {
  const navbarSource = fs.readFileSync("src/components/landing/LandingNavbar.tsx", "utf8");
  const brandLogoSource = fs.readFileSync("src/components/shared/BrandLogo.tsx", "utf8");

  await t.test("1. Wordmark renders STUDYSAATHI in bold dark chocolate brown (#49352F)", () => {
    assert.ok(
      brandLogoSource.includes("STUDYSAATHI"),
      "Must render prominent uppercase STUDYSAATHI wordmark"
    );
    assert.ok(
      brandLogoSource.includes("text-[#49352F]"),
      "STUDYSAATHI must be dark chocolate brown (#49352F)"
    );
    assert.ok(
      brandLogoSource.includes("font-[800]") || brandLogoSource.includes("font-extrabold"),
      "Font weight must be between 750 and 850"
    );
    assert.ok(
      brandLogoSource.includes("tracking-[0.025em]") || brandLogoSource.includes("tracking-wide"),
      "Must feature refined letter spacing"
    );
  });

  await t.test("2. Wordmark renders AI in warm burnt orange accent (#B26A1B) with stylish detail", () => {
    assert.ok(
      brandLogoSource.includes("text-[#B26A1B]"),
      "AI must feature warm burnt orange accent (#B26A1B)"
    );
    assert.ok(
      brandLogoSource.includes("font-[850]") || brandLogoSource.includes("font-black"),
      "AI must be bold and prominent"
    );
    assert.ok(
      brandLogoSource.includes("bg-[#B26A1B]/40") || brandLogoSource.includes("bg-[#B26A1B]"),
      "Must include subtle highlight / accent detail near AI"
    );
  });

  await t.test("3. Brand text size scales to 22-26px on desktop and logo icon is approx 25-30px", () => {
    assert.ok(
      brandLogoSource.includes("lg:text-[24px]") || brandLogoSource.includes("text-[24px]"),
      "Desktop brand text size must be approximately 24px (22-26px range)"
    );
    assert.ok(
      navbarSource.includes("size={isScrolled ? 26 : 28}") || navbarSource.includes("size={28}"),
      "Logo icon size must be approximately 25-30px"
    );
  });

  await t.test("4. Brand container features refined background, subtle border, and soft shadow", () => {
    assert.ok(
      navbarSource.includes("bg-[#FAF6E9]"),
      "Brand container must use refined warm background (#FAF6E9)"
    );
    assert.ok(
      navbarSource.includes("border-[#49352F]/15"),
      "Brand container must feature subtle border"
    );
    assert.ok(
      navbarSource.includes("shadow-[0_2px_8px_rgba(73,53,47,0.06)]"),
      "Brand container must feature soft, refined shadow"
    );
    assert.ok(
      navbarSource.includes("hover:border-[#B26A1B]/35"),
      "Brand container must have subtle hover state"
    );
  });

  await t.test("5. Navigation links and routes remain intact without regressions", () => {
    const requiredSections = ["#hero", "#challenge", "#solution", "#features", "#preview", "#impact"];
    for (const section of requiredSections) {
      assert.ok(navbarSource.includes(section), `Section anchor ${section} must be preserved`);
    }

    const requiredRoutes = ["/login", "/parent/login", "/dashboard", "/tutorial", "/ai"];
    for (const route of requiredRoutes) {
      assert.ok(navbarSource.includes(route), `Route destination ${route} must be preserved`);
    }
  });

  await t.test("6. Strictly zero emojis across modified branding files", () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.strictEqual(emojiRegex.test(navbarSource), false, "LandingNavbar must contain 0 emojis");
    assert.strictEqual(emojiRegex.test(brandLogoSource), false, "BrandLogo must contain 0 emojis");
  });
});

