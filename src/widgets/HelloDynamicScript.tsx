import { Dynamic, Script, type GDom } from "streak-forge/components";

/**
 * Demonstrates a <Script options={...}> nested inside a <Dynamic> block.
 * Covers two regressions in this combination:
 *
 * Regression 1 — __SF_OPTS__ ReferenceError on first load:
 *   streak-distiller's finalizePage fell through to its minify-fallback path
 *   when assembling dynamic-component JS (because `hasContent` is always true).
 *   That path used `script.content` raw without substituting the __SF_OPTS__
 *   placeholder with `script.optsData` → ReferenceError in the browser.
 *   Fixed in finalizePage/index.ts — fallback path now applies the same
 *   optsData substitution as the fast path.
 *
 * Regression 2 — dynamic panel silent no-op on SPA re-navigation:
 *   After navigating away and back via the SPA router, clicking "Load panel"
 *   appeared to do nothing. Root cause: loadDynamicComponent called
 *   addResourceToBody with the same content.js URL as the first visit (qv is
 *   frozen at render time in index.json, so the URL is always identical).
 *   addResourceToBody deduplicates by URL via loadedResources — it saw the URL
 *   as already-done and returned immediately without re-executing the script.
 *   Fixed in prepareForSiteOnlyOnce/index.ts — loadDynamicComponent now deletes
 *   the loadedResources entry before calling addResourceToBody, mirroring the
 *   same pattern hydratePage already uses for common.js.
 */

type HelloDynamicScriptProps = {
  data?: {
    label?: string;
    count?: number;
  };
};

const HelloDynamicScript = (props: HelloDynamicScriptProps) => {
  const label = props?.data?.label ?? "Dynamic Script Demo";
  const count = props?.data?.count ?? 0;

  return (
    <section
      id="hello-dynamic-script"
      style={{
        padding: "3rem 1.5rem",
        background: "#0f172a",
        textAlign: "center",
      }}
    >
      <p
        id="dynamic-script-status"
        style={{ color: "#94a3b8", marginBottom: "1.5rem", fontSize: "0.9rem" }}
      >
        Panel not loaded yet
      </p>

      <button
        id="load-dynamic-script-btn"
        style={{
          padding: "0.6rem 1.4rem",
          borderRadius: "0.5rem",
          border: "1px solid #6366f1",
          color: "#818cf8",
          background: "transparent",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        Load panel
      </button>

      {/*
        The <Script> below lives INSIDE a <Dynamic> block.
        It receives server-derived values (label, count) through `options`,
        which the build pipeline stores on a data-sf-opts attribute and
        substitutes back into the script as __SF_OPTS__ at build time.

        Before the fix, this substitution was skipped for dynamic-component
        scripts, leaving __SF_OPTS__ as a bare undefined identifier that
        threw a ReferenceError when the panel was loaded client-side.
      */}
      <Dynamic id="dynamic-script-panel">
        <div
          id="dynamic-script-content"
          style={{
            marginTop: "1.5rem",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(99,102,241,0.25)",
            background: "rgba(99,102,241,0.07)",
            color: "#e2e8f0",
          }}
        >
          Placeholder (replaced by dynamic load)
        </div>

        <Script
          id="dynamic-script-panel-script"
          options={{ label, count }}
        >
          {(_gDom: GDom, options: { label: string; count: number }) => {
            const el = document.getElementById("dynamic-script-content");
            if (el) {
              el.innerHTML = `
                <p style="font-size:0.8rem;color:#818cf8;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.08em">Dynamic panel</p>
                <p style="color:#e2e8f0">${options.label}</p>
                <p style="color:#94a3b8;font-size:0.875rem;margin-top:0.5rem">Server count: ${options.count}</p>
              `;
            }
            const status = document.getElementById("dynamic-script-status");
            if (status) {
              status.textContent = "Panel loaded — Script options resolved correctly";
              status.style.color = "#4ade80";
            }
          }}
        </Script>
      </Dynamic>

      <Script id="dynamic-script-trigger">
        {(gDom: GDom) => {
          const btn = document.getElementById("load-dynamic-script-btn");
          if (!btn) return;
          let loaded = false;
          btn.addEventListener("click", () => {
            if (loaded) return;
            loaded = true;
            btn.textContent = "Loading…";
            gDom.loadDynamicComponent("dynamic-script-panel", () => {
              btn.style.display = "none";
            });
          });
        }}
      </Script>
    </section>
  );
};

export default HelloDynamicScript;
