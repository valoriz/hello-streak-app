import { Dynamic, Script } from "streak-forge/components";

type HelloMessageProps = {
  data?: {
    quote?: string;
    author?: string;
    bonusFact?: string;
  };
};

const HelloMessage = (props: HelloMessageProps) => {
  const quote = props?.data?.quote ?? "Built with Streak.js";
  const author = props?.data?.author ?? "Anonymous";
  const bonusFact = props?.data?.bonusFact ?? "Streak.js pre-renders everything to static HTML.";

  return (
    <section
      className="py-28 px-6"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Quote mark */}
        <div
          className="text-8xl leading-none font-serif text-indigo-500 select-none mb-4"
          aria-hidden="true"
        >
          &ldquo;
        </div>

        <blockquote className="text-xl md:text-2xl text-gray-100 leading-relaxed font-light italic">
          {quote}
        </blockquote>

        <figcaption className="mt-6 text-sm text-indigo-400 font-medium tracking-wide uppercase">
          - {author}
        </figcaption>

        {/* Trigger */}
        <button
          id="load-fact-btn"
          className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-indigo-500/40 text-indigo-300 text-sm hover:border-indigo-400 hover:text-indigo-200 transition-all"
        >
          <span>Learn how Streak works under the hood</span>
          <span aria-hidden="true">→</span>
        </button>

        {/*
          Dynamic panel - absent from initial HTML, injected on button click.
          bonusFact is baked in at build time as a React prop.
        */}
        <Dynamic id="bonus-fact-panel">
          <div
            id="bonus-fact-content"
            className="mt-8 p-6 rounded-2xl border border-indigo-500/20 text-left"
            style={{
              background: "rgba(99,102,241,0.1)",
              opacity: 0,
              transition: "opacity 0.5s ease",
            }}
          >
            <p className="text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wider">
              Under the hood
            </p>
            <p className="text-gray-300 leading-relaxed text-sm">{bonusFact}</p>
          </div>
        </Dynamic>

        <Script id="hello-message-script">
          {(gDom: any) => {
            const btn = document.getElementById("load-fact-btn");
            if (!btn) return;

            let loaded = false;

            btn.addEventListener("click", () => {
              if (loaded) return;
              loaded = true;
              btn.textContent = "Loading…";

              gDom.loadDynamicComponent("bonus-fact-panel", () => {
                btn.style.display = "none";
                const panel = document.getElementById("bonus-fact-content");
                if (panel) {
                  requestAnimationFrame(() => {
                    panel.style.opacity = "1";
                  });
                }
              });
            });
          }}
        </Script>
      </div>
    </section>
  );
};

export default HelloMessage;
