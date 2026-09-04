/**
 * Tests for streak-forge's own primitives (Script, WidgetPlaceholder,
 * Dynamic, Preload) and — the main event — the Script "options" bridge:
 * the *only* way a server-derived value survives into browser-side code
 * (Script's child function is serialized via `.toString()`, so it cannot
 * close over widget-scope variables; see CLAUDE.md's Script section).
 *
 * Widgets are plain functions that return VNode objects (`{ type, props }`,
 * see streak-forge's src/jsx/element.ts) synchronously — no rendering
 * pipeline needed to inspect what a widget actually passed into `options`.
 *
 * Run with:  bun test
 */

import { describe, test, expect } from "bun:test";
import { Script, WidgetPlaceholder, Dynamic, Preload } from "streak-forge/components";
import HelloBanner from "../widgets/HelloBanner";
import HelloAnimated from "../widgets/HelloAnimated";
import HelloNav from "../widgets/HelloNav";
import HelloTerminal from "../widgets/HelloTerminal";
import HelloDynamicScript from "../widgets/HelloDynamicScript";

type VNode = { type: unknown; props: Record<string, any> };

/** Structural walk over a VNode tree — never invokes function components. */
const collectByType = (node: unknown, targetType: unknown, acc: VNode[] = []): VNode[] => {
  if (node === null || node === undefined || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const child of node) collectByType(child, targetType, acc);
    return acc;
  }
  const vnode = node as VNode;
  if (vnode.type === targetType) acc.push(vnode);
  if (vnode.props && "children" in vnode.props) {
    collectByType(vnode.props.children, targetType, acc);
  }
  return acc;
};

// ─── Script — the options -> data-sf-opts bridge ──────────────────────────────
describe("Script — options bridge (framework-level)", () => {
  test("data-sf-opts equals JSON.stringify(options)", () => {
    const options = { color: "#ffffff", count: 3 };
    const vnode = Script({ id: "x", options, children: () => {} }) as VNode;
    expect(vnode.props["data-sf-opts"]).toBe(JSON.stringify(options));
  });

  test("defaults to '{}' when options is omitted", () => {
    const vnode = Script({ id: "x", children: () => {} }) as VNode;
    expect(vnode.props["data-sf-opts"]).toBe("{}");
  });

  test("throws when options isn't JSON-serializable", () => {
    // A plain function *value* inside options is silently dropped by
    // JSON.stringify (only a *top-level* non-serializable value, or an
    // object whose toJSON() returns undefined, makes JSON.stringify itself
    // return undefined) — so toJSON is the accurate way to trigger this.
    const options = { toJSON: () => undefined };
    expect(() => Script({ id: "x", options, children: () => {} })).toThrow(/JSON-serializable/);
  });
});

// ─── Per-widget bridge tests ───────────────────────────────────────────────────
// Each of these proves the value flows from widget `data` -> Script `options`
// (not a stale default / closured variable) by round-tripping through the
// same JSON.stringify the real build pipeline uses.

describe("HelloBanner — Script options bridge (accentColor / animationMs)", () => {
  test("options reflect the widget's actual data", () => {
    const accentColor = "#00ffaa";
    const animationMs = 4321;
    const vnode = HelloBanner({ data: { accentColor, animationMs } });
    const bannerScript = collectByType(vnode, Script).find((s) => s.props.id === "hello-banner-script");

    expect(bannerScript).toBeDefined();
    expect(bannerScript!.props.options).toEqual({ accentColor, animationMs });

    const rendered = Script(bannerScript!.props as Parameters<typeof Script>[0]) as VNode;
    expect(rendered.props["data-sf-opts"]).toBe(JSON.stringify({ accentColor, animationMs }));
  });
});

describe("HelloAnimated — Script options bridge (animationDuration / words)", () => {
  test("options reflect the widget's actual data", () => {
    const animationDuration = 1.23;
    const words = ["Alpha", "Beta"];
    const vnode = HelloAnimated({ data: { animationDuration, words, cards: [] } });
    const animatedScript = collectByType(vnode, Script).find((s) => s.props.id === "hello-animated-script");

    expect(animatedScript).toBeDefined();
    expect(animatedScript!.props.options).toEqual({ animationDuration, words });

    const rendered = Script(animatedScript!.props as Parameters<typeof Script>[0]) as VNode;
    expect(rendered.props["data-sf-opts"]).toBe(JSON.stringify({ animationDuration, words }));
  });
});

describe("HelloNav — Script options bridge (streakCount)", () => {
  test("options reflect the widget's actual data", () => {
    const streakCount = 42;
    const vnode = HelloNav({ data: { streakCount } });
    const navScript = collectByType(vnode, Script).find((s) => s.props.id === "hello-nav-script");

    expect(navScript).toBeDefined();
    expect(navScript!.props.options).toEqual({ streakCount });

    const rendered = Script(navScript!.props as Parameters<typeof Script>[0]) as VNode;
    expect(rendered.props["data-sf-opts"]).toBe(JSON.stringify({ streakCount }));
  });
});

describe("HelloTerminal — Script options bridge (lines / typeSpeedMs)", () => {
  test("options reflect the widget's actual data", () => {
    const lines = ["$ one", "$ two"];
    const typeSpeedMs = 10;
    const vnode = HelloTerminal({ data: { lines, typeSpeedMs } });
    const termScript = collectByType(vnode, Script).find((s) => s.props.id === "hello-terminal-script");

    expect(termScript).toBeDefined();
    expect(termScript!.props.options).toEqual({ lines, typeSpeedMs });

    const rendered = Script(termScript!.props as Parameters<typeof Script>[0]) as VNode;
    expect(rendered.props["data-sf-opts"]).toBe(JSON.stringify({ lines, typeSpeedMs }));
  });
});

// ─── Script inside Dynamic — options bridge + SPA re-navigation regressions ───
// Regression 1: streak-distiller's finalizePage fell through to its minify-
// fallback path for dynamic-component scripts (because hasContent=true when
// assembling the component JS). That path used script.content raw without
// substituting __SF_OPTS__ → ReferenceError in the browser.
// These tests verify the VNode shape is correct so the pipeline has the right
// data to perform the substitution.
//
// Regression 2: on SPA re-navigation, loadDynamicComponent called
// addResourceToBody with the same content.js URL (qv frozen in index.json), which
// addResourceToBody's loadedResources cache treated as already-done — script never
// re-executed, panel stayed as placeholder. Fixed in loadDynamicComponent by
// evicting the loadedResources entry before each call (same pattern as common.js).
// The VNode-level tests below remain valid: the widget produces the correct
// data-sf-opts on every render, so each SPA visit supplies fresh optsData for
// the content.js that loadDynamicComponent now correctly re-fetches.
describe("HelloDynamicScript — Script options inside Dynamic", () => {
  test("widget renders without throwing", () => {
    expect(() => HelloDynamicScript({ data: { label: "Test label", count: 7 } })).not.toThrow();
  });

  test("script inside Dynamic carries options on data-sf-opts", () => {
    const label = "Hello from server";
    const count = 42;
    const vnode = HelloDynamicScript({ data: { label, count } });

    // Find the Script inside the Dynamic — must carry the server values.
    const panelScript = collectByType(vnode, Script).find(
      (s) => s.props.id === "dynamic-script-panel-script"
    );

    expect(panelScript).toBeDefined();
    expect(panelScript!.props.options).toEqual({ label, count });

    const rendered = Script(panelScript!.props as Parameters<typeof Script>[0]) as VNode;
    expect(rendered.props["data-sf-opts"]).toBe(JSON.stringify({ label, count }));
  });

  test("data-sf-opts on inner Script differs from outer trigger Script (no options)", () => {
    const vnode = HelloDynamicScript({ data: { label: "X", count: 1 } });

    const triggerScript = collectByType(vnode, Script).find(
      (s) => s.props.id === "dynamic-script-trigger"
    );
    // Outer trigger has no options — must default to '{}'
    expect(triggerScript).toBeDefined();
    const renderedTrigger = Script(triggerScript!.props as Parameters<typeof Script>[0]) as VNode;
    expect(renderedTrigger.props["data-sf-opts"]).toBe("{}");
  });

  test("data-sf-opts contains the actual server values, not defaults", () => {
    const label = "Custom label";
    const count = 99;
    const vnode = HelloDynamicScript({ data: { label, count } });

    const panelScript = collectByType(vnode, Script).find(
      (s) => s.props.id === "dynamic-script-panel-script"
    );
    const rendered = Script(panelScript!.props as Parameters<typeof Script>[0]) as VNode;
    const opts = JSON.parse(rendered.props["data-sf-opts"]);

    expect(opts.label).toBe(label);
    expect(opts.count).toBe(count);
  });

  test("Dynamic node wraps the Script node", () => {
    const vnode = HelloDynamicScript({ data: { label: "L", count: 0 } });
    const dynamics = collectByType(vnode, Dynamic);
    const panelDynamic = dynamics.find((d) => d.props.id === "dynamic-script-panel");

    expect(panelDynamic).toBeDefined();

    // Script should be a descendant of the Dynamic node
    const innerScripts = collectByType(panelDynamic, Script);
    const found = innerScripts.find((s) => s.props.id === "dynamic-script-panel-script");
    expect(found).toBeDefined();
  });
});

// ─── Other streak-forge primitives ─────────────────────────────────────────────
describe("WidgetPlaceholder", () => {
  test("throws when id is missing", () => {
    expect(() => WidgetPlaceholder({ id: "", type: "Foo" })).toThrow();
  });

  test("throws when type is missing", () => {
    expect(() => WidgetPlaceholder({ id: "Foo" } as never)).toThrow();
  });

  test("returns a marker vnode carrying id/type when valid", () => {
    const vnode = WidgetPlaceholder({ id: "Foo", type: "Foo" }) as VNode;
    expect(vnode.props.id).toBe("Foo");
    expect(vnode.props.type).toBe("Foo");
  });
});

describe("Dynamic", () => {
  test("throws when id is missing", () => {
    expect(() => Dynamic({ id: "" })).toThrow();
  });

  test("wraps children under the given id", () => {
    const vnode = Dynamic({ id: "panel", children: "hello" }) as VNode;
    expect(vnode.props.id).toBe("panel");
    expect(vnode.props.children).toBe("hello");
  });
});

describe("Preload", () => {
  test("passes href/as/media through unchanged", () => {
    const vnode = Preload({ href: "/img.png", as: "image", media: "(min-width: 768px)" }) as VNode;
    expect(vnode.props.href).toBe("/img.png");
    expect(vnode.props.as).toBe("image");
    expect(vnode.props.media).toBe("(min-width: 768px)");
  });
});
