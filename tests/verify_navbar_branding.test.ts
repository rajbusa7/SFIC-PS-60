import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";

test("Navbar Branding and StudySaathi AI Logo Verification Suite", async (t) => {
  const navbarSource = fs.readFileSync("src/components/landing/LandingNavbar.tsx", "utf8");
  const brandLogoSource = fs.readFileSync("src/components/shared/BrandLogo.tsx", "utf8");

  await t.test("1. Brand link in navbar navigates to existing landing-page route ('/')", () => {
    assert.ok(
      navbarSource.includes('href="/"'),
      "Brand link must navigate to the landing-page route ('/')"
    );
    assert.ok(
      !navbarSource.includes('href="#hero"\n              onClick={(e) => handleNavClick(e, "#hero")}\n              className="cursor-pointer group flex items-center gap-2.5 transition-transform duration-200 active:scale-95"'),
      "Old relative #hero brand link must be replaced with canonical route link"
    );
  });

  await t.test("2. Brand container uses prominent cream pill styling with high contrast", () => {
    assert.ok(
      navbarSource.includes("bg-[#FAF6E9]"),
      "Navbar brand container must use cream background (#FAF6E9)"
    );
    assert.ok(
      navbarSource.includes("border-[#49352F]/15"),
      "Navbar brand container must feature subtle border"
    );
    assert.ok(
      navbarSource.includes("rounded-2xl"),
      "Navbar brand container must have rounded-2xl pill geometry"
    );
  });

  await t.test("3. BrandLogo renders 'StudySaathi' in dark brown (#49352F)", () => {
    assert.ok(
      brandLogoSource.includes('titleStudyClass = isNavbar\n    ? "text-[#49352F]"') ||
      brandLogoSource.includes('titleStudyClass = isNavbar\r\n    ? "text-[#49352F]"') ||
      brandLogoSource.includes('text-[#49352F]'),
      "titleStudyClass must be dark brown (#49352F)"
    );
    assert.ok(
      brandLogoSource.includes('titleSaathiClass = isNavbar\n    ? "text-[#49352F]"') ||
      brandLogoSource.includes('titleSaathiClass = isNavbar\r\n    ? "text-[#49352F]"') ||
      brandLogoSource.includes('text-[#49352F]'),
      "titleSaathiClass must be dark brown (#49352F)"
    );
  });

  await t.test("4. BrandLogo highlights 'AI' in peach (#F2CAB3)", () => {
    assert.ok(
      brandLogoSource.includes("bg-[#F2CAB3]"),
      "AI badge must be highlighted in peach (#F2CAB3)"
    );
    assert.ok(
      brandLogoSource.includes("text-[#49352F]"),
      "AI badge text must be dark brown for contrast"
    );
  });

  await t.test("5. All existing navigation links and destinations remain intact", () => {
    const requiredLinks = ["#hero", "#challenge", "#solution", "#features", "#preview", "#impact"];
    for (const link of requiredLinks) {
      assert.ok(
        navbarSource.includes(`href: "${link}"`),
        `Navigation section link ${link} must be preserved`
      );
    }

    const ctaRoutes = ["/login", "/parent/login", "/dashboard", "/tutorial", "/ai"];
    for (const route of ctaRoutes) {
      assert.ok(
        navbarSource.includes(`"${route}"`) || navbarSource.includes(`'${route}'`),
        `CTA route ${route} must be preserved`
      );
    }
  });

  await t.test("6. No emojis present in modified files", () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.strictEqual(emojiRegex.test(navbarSource), false, "LandingNavbar must contain 0 emojis");
    assert.strictEqual(emojiRegex.test(brandLogoSource), false, "BrandLogo must contain 0 emojis");
  });
});
