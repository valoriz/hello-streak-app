# hello-streak-app

A reference "Hello World" application built with **Streak.js** (`streak-forge`) — a static site generator that pre-renders every page to plain HTML at build time. No framework JS ships to the browser by default.

---

## What this app demonstrates

| Feature | Widget |
|---|---|
| `Preload` — resource hinting | `PageHead`, `HelloBanner` |
| `Script` — client interactivity via serialized IIFE | `HelloNav`, `HelloBanner` |
| `Dynamic` — deferred DOM injection on demand | `HelloFeatures`, `HelloMessage` |
| `loadPackage` — third-party JS via Web Worker | `HelloAnimated` (Motion.js) |
| `loadingStrategy: "lazy"` — deferred widget JS | `HelloFeatures`, `HelloAnimated`, `HelloMessage`, `HelloFooter` |

---

## Requirements

| Tool | Version |
|---|---|
| Bun | ≥ 1.2 |
| Node.js | ≥ 20 (for ESLint) |
| Python 3 | any (for `bun run start`) |

---

## Quick start

```bash
# 1. Install dependencies
bun install

# 2. Start development (Tailwind watch + streak-forge dev server, runs in parallel)
bun run dev

# 3. Open the local dev server URL printed by streak-forge
```

---

## All commands

```bash
# Development
bun run dev           # Tailwind watch + streak-forge dev server (parallel)
bun run dev:streak    # streak-forge dev server only
bun run css-dev       # Tailwind CSS watch only

# Production build
bun run build         # compile CSS + streak-forge pre-build  →  out/

# Preview the build
bun run start         # serve out/ on http://localhost:8000

# Quality checks  (run all three before every build)
bun run validate      # structural: sitemap ↔ file system consistency
bun run lint          # ESLint with custom Streak rules
bun run lint:fix      # ESLint auto-fix
bun run typecheck     # tsc --noEmit

# Testing
bun test              # run all tests once
bun test --watch      # watch mode
```

---

## Project structure

```
hello-streak-app/
├── streak.sitemap.json          # page registry — source of truth for all pages
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── eslint.config.js             # ESLint 9 flat config + inline Streak plugin
│
├── src/
│   ├── handlers/
│   │   └── HomeDataHandler.ts   # async data provider for the home page
│   ├── layouts/
│   │   └── MainLayout.tsx       # full <html> layout with WidgetPlaceholder slots
│   ├── widgets/
│   │   ├── PageHead.tsx         # <head> content + Preload hints
│   │   ├── HelloNav.tsx         # navigation bar (Script for mobile menu)
│   │   ├── HelloBanner.tsx      # hero section (Preload + Script)
│   │   ├── HelloFeatures.tsx    # feature cards (Dynamic + Script)
│   │   ├── HelloAnimated.tsx    # Motion.js animations (loadPackage)
│   │   ├── HelloMessage.tsx     # testimonial / quote (Dynamic + Script)
│   │   └── HelloFooter.tsx      # site footer
│   ├── scripts/
│   │   └── streak-validate.ts   # structural validator (bun run validate)
│   ├── common/styles/
│   │   └── input.css            # Tailwind entry point
│   └── tests/
│       ├── HomeDataHandler.test.ts
│       └── widgets.test.ts
│
├── public/
│   ├── images/streak-logo.svg
│   └── assets/js/motion.js      # Motion.js — committed, loaded via Web Worker
│
└── out/                         # build output (gitignored)
    └── homeRenderId/
        └── index.html
```

---

## How Streak.js works

```
streak.sitemap.json
       │
       ├── dataHandler ──►  HomeDataHandler.ts   runs once at build time
       │                    returns { status: 200, PageHead: {...}, HelloBanner: {...}, ... }
       │
       ├── rootLayout  ──►  MainLayout.tsx        full <html> doc with WidgetPlaceholder slots
       │
       └── widgets[]   ──►  src/widgets/*.tsx     each receives { data: handlerData[widgetId] }
                            rendered to HTML strings, injected into layout slots
```

**Build output:** `out/homeRenderId/index.html` — a complete, self-contained static HTML file. Nothing renders at runtime; the browser receives finished HTML.

---

## Validation

This project ships a structural validator (`src/scripts/streak-validate.ts`) and custom ESLint rules. They catch common Streak mistakes before `streak-forge pre-build` runs.

```bash
bun run validate
```

Checks performed:

| # | Check |
|---|---|
| 1 | `renderId` values are globally unique |
| 2 | All handler / layout / widget files referenced in the sitemap exist on disk |
| 3 | `loadingStrategy` values are valid (`"lazy"` only) |
| 4 | Every sitemap widget has a matching `WidgetPlaceholder` in its layout |
| 5 | Handler files have `export default` and return `status: 200` |
| 6 | Widget files have `export default`; warns on unsafe `props.data.` access and hook usage |
| 7 | Local asset paths referenced in handlers exist in `public/` |

### Custom ESLint rules (`eslint.config.js`)

| Rule | Level | What it catches |
|---|---|---|
| `streak/no-hooks-in-widgets` | error | `useState`, `useEffect`, etc. in `src/widgets/` |
| `streak/require-default-export` | error | Missing `export default` in widgets / layouts / handlers |
| `streak/no-direct-data-access` | warn | `props.data.x` without optional chaining in widgets |
| `streak/script-options-bridge` | warn | Script children whose first param isn't named `gDom` |

---

## Key concepts

### Script — passing data to the browser

The `Script` component's child function is serialized via `.toString()` and executed as an IIFE. It cannot close over component-scope variables. Use `options` to pass server-derived values:

```tsx
// Wrong — `color` is undefined after serialization
<Script id="x">{() => { el.style.color = color; }}</Script>

// Correct — pass through options
<Script id="x" options={{ color }}>
  {(gDom: any, options: any) => { el.style.color = options.color; }}
</Script>
```

### Dynamic — deferred DOM injection

Content inside `<Dynamic id="panel">` is stripped from the initial HTML and injected only when `gDom.loadDynamicComponent("panel", callback)` is called:

```tsx
<Dynamic id="my-panel">
  <div id="my-panel-content" style={{ opacity: 0 }}>...</div>
</Dynamic>

<Script id="my-script">
  {(gDom: any) => {
    document.getElementById("btn")?.addEventListener("click", () => {
      gDom.loadDynamicComponent("my-panel", () => {
        const el = document.getElementById("my-panel-content");
        if (el) requestAnimationFrame(() => { el.style.opacity = "1"; });
      });
    });
  }}
</Script>
```

### loadPackage — third-party JS via Web Worker

Loads a file from `public/assets/js/` off the main thread:

```tsx
<Script id="my-script">
  {(gDom: any) => {
    gDom.loadPackage("js/motion.js").then(() => {
      const { animate } = (gDom as any).Motion;
      animate("#el", { opacity: [0, 1] }, { duration: 0.5 });
    });
  }}
</Script>
```

---

## Testing

Tests use **bun:test** (Jest-compatible, zero extra packages).

```bash
bun test
```

Test files live in `src/tests/`. The pattern is to test handler data shape and integrity — not DOM output, since widgets produce static HTML.

---

## Tech stack

- **Streak.js / streak-forge** — static site generator
- **Bun** — runtime, package manager, test runner
- **TailwindCSS v3** — utility-first CSS
- **TypeScript** — strict mode
- **ESLint 9** — flat config with inline Streak plugin
- **Motion.js** — animation library (loaded via Web Worker)
- **concurrently** — parallel dev scripts

---

## License

MIT
