// ─── Data Handler ─────────────────────────────────────────────────────────────
// Default-exported async function. Each key must match a widget "type" in the
// sitemap. Streak passes { data: value } to the matching widget as props.
// ─────────────────────────────────────────────────────────────────────────────

const getHomeData = async () => {
  return {
    status: 200,

    PageHead: {
      title: "Hello Streak — Minimal Starter",
      description: "A minimal Hello World app built with Streak.js — the static site generator for React.",
      heroImageUrl: "/images/hero.webp",
    },

    HelloNav: {
      logoSrc: "/images/streak-logo.svg",
      logoAlt: "Streak.js",
      links: [
        { label: "Home",   href: "/" },
        { label: "Docs",   href: "#" },
        { label: "GitHub", href: "#" },
      ],
    },

    HelloBanner: {
      heading: "Hello, World.",
      subheading: "Build blazing-fast static sites with React components, zero runtime overhead.",
      cta: { label: "Get Started", href: "#features" },
      // Free image from Picsum Photos — https://picsum.photos (no attribution required)
      // Seeded URL so the image stays consistent across builds.
      backgroundImage: "https://picsum.photos/seed/streakjs-hero/1600/900",
      accentColor: "#818cf8",
      animationMs: 700,
    },

    HelloFeatures: {
      heading: "What Streak.js gives you",
      features: [
        {
          id: "f1",
          title: "Static HTML at Build Time",
          description:
            "Every page is pre-rendered to plain HTML. No framework ships to the browser — just fast, indexable markup.",
          image: "https://picsum.photos/seed/streak-feat-1/600/400",
          imageAlt: "Server rack with code",
        },
        {
          id: "f2",
          title: "Widget-Driven Pages",
          description:
            "Pages are assembled from independent widgets. Each widget owns its markup, styles, and optional client script.",
          image: "https://picsum.photos/seed/streak-feat-2/600/400",
          imageAlt: "Modular component blocks",
        },
        {
          id: "f3",
          title: "Dynamic on Demand",
          description:
            "Heavy content is deferred with <Dynamic>. Load it on scroll, on click, or after a delay — your call.",
          image: "https://picsum.photos/seed/streak-feat-3/600/400",
          imageAlt: "Loading spinner to finished state",
        },
      ],
    },

    HelloAnimated: {
      animationDuration: 0.65,
      // Words cycle in the morphing headline — swap out for any list
      words: ["Fast", "Beautiful", "Powerful", "Reliable"],
      cards: [
        {
          id: "c1",
          icon: "⚡",
          title: "Zero Runtime",
          description:
            "Pages are pre-rendered at build time. No framework ships to the browser — just lean, fast HTML.",
        },
        {
          id: "c2",
          icon: "🧩",
          title: "Widget System",
          description:
            "Assemble pages from independent React widgets. Each widget owns its markup, styles, and Scripts.",
        },
        {
          id: "c3",
          icon: "✨",
          title: "Script & Dynamic",
          description:
            "Drop in client interactivity with Script. Defer heavy content with Dynamic — loaded on demand.",
        },
      ],
    },

    HelloMessage: {
      quote:
        "Streak.js is the missing link between a React component tree and a genuinely static website.",
      author: "Streak.js Team",
      bonusFact:
        "At build time Streak serialises your data handler output, renders every React widget to an HTML string, and stitches it all into a complete page — no hydration, no client bundle.",
    },

    HelloFooter: {
      logoSrc: "/images/streak-logo.svg",
      logoAlt: "Streak.js",
      tagline: "The React static site generator.",
      year: new Date().getFullYear(),
    },
  };
};

export default getHomeData;
