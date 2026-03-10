import { Script } from "streak/components";

// ─── How loadPackage works internally ─────────────────────────────────────────
//
//  gDom.loadPackage("js/motion.js")
//
//  1. Streak's asset-worker-handler (injected into every page) creates a
//     dedicated Web Worker (asset-worker.js) on the first call.
//
//  2. The handler sends { type: "LOAD_ASSET", assetId: "js/motion.js" }
//     to the worker via postMessage().
//
//  3. The Web Worker (running off the main thread) fetches the file:
//         fetch("/assets/js/motion.js")
//     → maps to public/js/motion.js in the dev server / build output.
//
//  4. The worker posts the file content back to the main thread.
//
//  5. The handler injects a <script> tag into <head> with that content,
//     so the library's global (e.g. window.Motion) becomes available.
//
//  6. The Promise returned by loadPackage resolves — you can now use the lib.
//
//  You access the loaded library via: (gDom as any).LibraryGlobalName
//  e.g.  const { animate, inView } = (gDom as any).Motion;
//
// ─── Separate user-created Web Worker (Blob pattern) ─────────────────────────
//
//  For CPU-intensive work (computing particle positions, path math, etc.)
//  you can spin up your own Web Worker inline using a Blob URL — no
//  separate worker file needed.
//
//      const blob = new Blob([`self.onmessage = ...`], { type: "application/javascript" });
//      const url  = URL.createObjectURL(blob);
//      const worker = new Worker(url);
//      worker.postMessage({ ... });
//      worker.onmessage = (e) => { /* use result */ URL.revokeObjectURL(url); worker.terminate(); };
//
// ─────────────────────────────────────────────────────────────────────────────

type Stat = {
  id: string;
  value: number;
  label: string;
  suffix?: string;
};

type HelloAnimatedProps = {
  data?: {
    heading?: string;
    subheading?: string;
    stats?: Stat[];
    particleCount?: number;
    animationDuration?: number;
  };
};

const HelloAnimated = (props: HelloAnimatedProps) => {
  const heading = props?.data?.heading ?? "Animated with Motion.js";
  const subheading = props?.data?.subheading ?? "Loaded off-thread via Streak's asset worker";
  const stats = props?.data?.stats ?? [];
  const particleCount = props?.data?.particleCount ?? 50;
  const animationDuration = props?.data?.animationDuration ?? 0.7;

  return (
    <section
      id="hello-animated"
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: "#f8fafc" }}
    >
      {/* Canvas sits behind content — particles drawn here by the user Worker */}
      <canvas
        id="particle-canvas"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div id="animated-header" className="text-center mb-16" style={{ opacity: 0 }}>
          <span className="inline-block mb-3 px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full bg-indigo-100 text-indigo-600">
            Motion.js + Web Worker
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
            {heading}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">{subheading}</p>
        </div>

        {/* Stat cards — start invisible, animated in by Motion.inView */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.id}
              className="stat-card p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center"
              data-target={stat.value}
              data-index={i}
              style={{ opacity: 0, transform: "translateY(30px)" }}
            >
              <div
                className="stat-number text-5xl font-extrabold text-indigo-600 tabular-nums"
                data-value={stat.value}
              >
                0
              </div>
              {stat.suffix && (
                <span className="text-2xl font-bold text-indigo-400">{stat.suffix}</span>
              )}
              <p className="mt-2 text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Source callout */}
        <p className="mt-10 text-center text-xs text-gray-400">
          Cards animate via{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-500">
            Motion.inView
          </code>{" "}
          · particles computed in a{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-500">
            new Worker(blobUrl)
          </code>
        </p>
      </div>

      {/*
        Script wires up:
          A. gDom.loadPackage  → Streak asset-worker fetches motion.js off-thread
          B. Blob Worker       → computes particle positions on a separate thread
          C. Motion.inView     → triggers stat card animations on scroll
          D. Count-up          → increments displayed numbers to their target values
      */}
      <Script
        id="hello-animated-script"
        options={{ particleCount, animationDuration }}
      >
        {(gDom: any, options: any) => {

          // ── A. Load motion.js via Streak's built-in asset worker ────────────
          //
          // loadPackage(path) sends a message to Streak's asset-worker.js,
          // which fetches /assets/<path> on a separate thread, then posts
          // the file content back. The handler injects it as a <script> tag
          // so the library global (window.Motion) becomes available.
          //
          // Path resolves to: public/js/motion.js  (run: bun run setup:packages)
          gDom
            .loadPackage("js/motion.js")
            .then(() => {
              // After the Promise resolves, the library's global is on gDom (= window)
              const { animate, inView } = (gDom as any).Motion;

              // Animate the section header
              const header = document.getElementById("animated-header");
              if (header) {
                animate(
                  header,
                  { opacity: [0, 1], transform: ["translateY(-20px)", "translateY(0)"] },
                  { duration: options.animationDuration, easing: "ease-out" }
                );
              }

              // ── C. Motion.inView — trigger card animations when visible ───
              //
              // inView(element, onEnter, options?)
              //   element  – selector or HTMLElement to observe
              //   onEnter  – ({ target }) => void  called when element enters viewport
              //   options  – { margin: "..." }  shrink/expand the trigger zone
              //
              // Returns a cleanup function to stop observing.
              inView(
                "#hello-animated",
                () => {
                  const cards = document.querySelectorAll<HTMLElement>(".stat-card");

                  cards.forEach((card, i) => {
                    // ── Motion.animate ──────────────────────────────────────
                    // animate(element, keyframes, options)
                    //   element   – DOM element or selector
                    //   keyframes – { prop: [from, to] } or { prop: to }
                    //   options   – { duration, delay, easing }
                    animate(
                      card,
                      {
                        opacity: [0, 1],
                        transform: ["translateY(30px)", "translateY(0)"],
                      },
                      {
                        duration: options.animationDuration,
                        delay: i * 0.12,
                        easing: [0.25, 0.1, 0.25, 1], // cubic-bezier
                      }
                    );
                  });

                  // ── D. Count-up numbers after cards are visible ──────────
                  setTimeout(() => {
                    cards.forEach((card) => {
                      const display = card.querySelector<HTMLElement>(".stat-number");
                      const target = parseInt(card.dataset["target"] ?? "0", 10);
                      if (!display || !target) return;

                      const duration = 1400;
                      const start = performance.now();

                      const tick = (now: number) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        // ease-out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        display.textContent = Math.round(eased * target).toLocaleString();
                        if (progress < 1) requestAnimationFrame(tick);
                      };

                      requestAnimationFrame(tick);
                    });
                  }, 300);
                },
                { margin: "-80px 0px" } // trigger 80px before element enters viewport
              );
            })
            .catch((err: unknown) => {
              console.error("[HelloAnimated] Failed to load motion.js:", err);
            });

          // ── B. User-created Blob Worker — particle positions ─────────────
          //
          // This is a completely separate Web Worker from Streak's asset-worker.
          // We embed the worker source as a string and create it via Blob URL,
          // so no separate worker file is needed.
          //
          // The worker runs on a separate thread: heavy math won't block
          // the main thread or jank the page animations.
          const workerSource = `
            self.onmessage = function (e) {
              var count  = e.data.count;
              var width  = e.data.width;
              var height = e.data.height;

              var particles = [];
              for (var i = 0; i < count; i++) {
                particles.push({
                  x:       Math.random() * width,
                  y:       Math.random() * height,
                  radius:  1.5 + Math.random() * 3,
                  speedX:  (Math.random() - 0.5) * 0.4,
                  speedY:  (Math.random() - 0.5) * 0.4,
                  opacity: 0.15 + Math.random() * 0.35,
                  phase:   Math.random() * Math.PI * 2,
                });
              }

              // Post initial positions back to main thread
              self.postMessage({ type: "INIT", particles: particles });

              // Worker stays alive — main thread can send "TICK" to request
              // updated positions each frame (demonstrating ongoing communication)
              self.onmessage = function (msg) {
                if (msg.data.type !== "TICK") return;
                var t = msg.data.t;
                for (var i = 0; i < particles.length; i++) {
                  var p = particles[i];
                  p.x += p.speedX;
                  p.y += p.speedY + Math.sin(t * 0.001 + p.phase) * 0.3;
                  if (p.x < 0)      p.x = msg.data.width;
                  if (p.x > msg.data.width)  p.x = 0;
                  if (p.y < 0)      p.y = msg.data.height;
                  if (p.y > msg.data.height) p.y = 0;
                }
                self.postMessage({ type: "POSITIONS", particles: particles });
              };
            };
          `;

          // Create Blob URL — no separate file needed
          const blob = new Blob([workerSource], { type: "application/javascript" });
          const workerUrl = URL.createObjectURL(blob);
          const worker = new Worker(workerUrl);

          const canvas = document.getElementById("particle-canvas") as HTMLCanvasElement | null;
          const section = document.getElementById("hello-animated");

          if (!canvas || !section) {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            return;
          }

          const resize = () => {
            canvas.width = section.offsetWidth;
            canvas.height = section.offsetHeight;
          };
          resize();
          window.addEventListener("resize", resize, { passive: true });

          const ctx = canvas.getContext("2d");

          // Send init message to worker
          worker.postMessage({
            type: "INIT",
            count: options.particleCount,
            width: canvas.width,
            height: canvas.height,
          });

          let rafId: number;

          // Worker responds with initial positions, then we start the render loop
          worker.onmessage = (e: MessageEvent) => {
            if (e.data.type === "INIT") {
              // Render loop on main thread — only drawing, no computation
              const draw = () => {
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const particles = e.data.particles as Array<{
                  x: number;
                  y: number;
                  radius: number;
                  opacity: number;
                }>;

                for (const p of particles) {
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                  ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
                  ctx.fill();
                }

                // Ask worker to compute next frame positions (off-thread)
                worker.postMessage({
                  type: "TICK",
                  t: performance.now(),
                  width: canvas.width,
                  height: canvas.height,
                });

                rafId = requestAnimationFrame(draw);
              };

              draw();
            }

            if (e.data.type === "POSITIONS") {
              // Updated positions arrive — next draw() call will use them
              // (the closure over e.data.particles updates automatically)
            }
          };

          // Cleanup when page unloads
          window.addEventListener("unload", () => {
            cancelAnimationFrame(rafId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
          });
        }}
      </Script>
    </section>
  );
};

export default HelloAnimated;
