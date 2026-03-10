/**
 * Tests for HomeDataHandler
 *
 * Run with:  bun test
 * Watch:     bun test --watch
 *
 * Bun ships a built-in Jest-compatible test runner — no extra packages needed.
 * Import from "bun:test" instead of "jest".
 */

import { describe, test, expect, beforeAll } from "bun:test";
import getHomeData from "../handlers/HomeDataHandler";

// ─── Shared fixture ───────────────────────────────────────────────────────────
// Call the handler once and reuse across all assertions.
let data: Awaited<ReturnType<typeof getHomeData>>;

beforeAll(async () => {
  data = await getHomeData();
});

// ─── Top-level shape ──────────────────────────────────────────────────────────
describe("HomeDataHandler — top-level shape", () => {
  test("returns status 200", () => {
    expect(data.status).toBe(200);
  });

  test("contains all required widget keys", () => {
    const requiredKeys = [
      "PageHead",
      "HelloNav",
      "HelloBanner",
      "HelloFeatures",
      "HelloMessage",
      "HelloFooter",
    ];
    for (const key of requiredKeys) {
      expect(data).toHaveProperty(key);
    }
  });
});

// ─── PageHead ─────────────────────────────────────────────────────────────────
describe("HomeDataHandler — PageHead", () => {
  test("has a non-empty title", () => {
    expect(data.PageHead.title).toBeTruthy();
    expect(typeof data.PageHead.title).toBe("string");
  });

  test("has a non-empty description", () => {
    expect(data.PageHead.description).toBeTruthy();
  });

  test("heroImageUrl is a string when present", () => {
    if (data.PageHead.heroImageUrl !== undefined) {
      expect(typeof data.PageHead.heroImageUrl).toBe("string");
    }
  });
});

// ─── HelloNav ─────────────────────────────────────────────────────────────────
describe("HomeDataHandler — HelloNav", () => {
  test("has at least one nav link", () => {
    expect(data.HelloNav.links.length).toBeGreaterThan(0);
  });

  test("every link has a label and href", () => {
    for (const link of data.HelloNav.links) {
      expect(link.label).toBeTruthy();
      expect(link.href).toBeTruthy();
    }
  });
});

// ─── HelloBanner ─────────────────────────────────────────────────────────────
describe("HomeDataHandler — HelloBanner", () => {
  test("heading is a non-empty string", () => {
    expect(data.HelloBanner.heading).toBeTruthy();
  });

  test("accentColor is a valid hex string", () => {
    expect(data.HelloBanner.accentColor).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });

  test("animationMs is a positive number", () => {
    expect(data.HelloBanner.animationMs).toBeGreaterThan(0);
  });

  test("cta has label and href", () => {
    expect(data.HelloBanner.cta?.label).toBeTruthy();
    expect(data.HelloBanner.cta?.href).toBeTruthy();
  });
});

// ─── HelloFeatures ────────────────────────────────────────────────────────────
describe("HomeDataHandler — HelloFeatures", () => {
  test("has at least one feature", () => {
    expect(data.HelloFeatures.features.length).toBeGreaterThan(0);
  });

  test("every feature has id, title, description, image, imageAlt", () => {
    for (const feature of data.HelloFeatures.features) {
      expect(feature.id).toBeTruthy();
      expect(feature.title).toBeTruthy();
      expect(feature.description).toBeTruthy();
      expect(feature.image).toBeTruthy();
      expect(feature.imageAlt).toBeTruthy();
    }
  });

  test("feature ids are unique", () => {
    const ids = data.HelloFeatures.features.map((f) => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─── HelloAnimated ───────────────────────────────────────────────────────────
describe("HomeDataHandler — HelloAnimated", () => {
  test("has a heading", () => {
    expect(data.HelloAnimated.heading).toBeTruthy();
  });

  test("particleCount is a positive integer", () => {
    expect(data.HelloAnimated.particleCount).toBeGreaterThan(0);
    expect(Number.isInteger(data.HelloAnimated.particleCount)).toBe(true);
  });

  test("animationDuration is between 0 and 5 seconds", () => {
    expect(data.HelloAnimated.animationDuration).toBeGreaterThan(0);
    expect(data.HelloAnimated.animationDuration).toBeLessThanOrEqual(5);
  });

  test("has at least one stat", () => {
    expect(data.HelloAnimated.stats.length).toBeGreaterThan(0);
  });

  test("every stat has id, value (number), and label", () => {
    for (const stat of data.HelloAnimated.stats) {
      expect(stat.id).toBeTruthy();
      expect(typeof stat.value).toBe("number");
      expect(stat.label).toBeTruthy();
    }
  });

  test("stat ids are unique", () => {
    const ids = data.HelloAnimated.stats.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── HelloMessage ─────────────────────────────────────────────────────────────
describe("HomeDataHandler — HelloMessage", () => {
  test("has a quote string", () => {
    expect(data.HelloMessage.quote).toBeTruthy();
  });

  test("has an author string", () => {
    expect(data.HelloMessage.author).toBeTruthy();
  });

  test("has a bonusFact string", () => {
    expect(data.HelloMessage.bonusFact).toBeTruthy();
  });
});

// ─── HelloFooter ─────────────────────────────────────────────────────────────
describe("HomeDataHandler — HelloFooter", () => {
  test("year is the current year", () => {
    expect(data.HelloFooter.year).toBe(new Date().getFullYear());
  });

  test("logoSrc is a string", () => {
    expect(typeof data.HelloFooter.logoSrc).toBe("string");
  });
});
