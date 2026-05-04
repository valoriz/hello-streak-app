import { Script } from "streak-forge/components";

type NavLink = { label: string; href: string };

type HelloNavProps = {
  data?: {
    logoSrc?: string;
    logoAlt?: string;
    links?: NavLink[];
  };
};

const HelloNav = (props: HelloNavProps) => {
  const logoSrc = props?.data?.logoSrc ?? "/images/streak-logo.svg";
  const logoAlt = props?.data?.logoAlt ?? "Streak.js";
  const links = props?.data?.links ?? [];

  return (
    <header
      id="site-nav"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <img
            src={logoSrc}
            alt={logoAlt}
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-white font-semibold text-lg tracking-tight group-hover:opacity-80 transition-opacity">
            Streak<span className="text-indigo-400">.js</span>
          </span>
        </a>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-300 hover:text-white transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Star on GitHub ★
          </a>
        </nav>
      </div>

      {/* Script: add background when user scrolls past the hero */}
      <Script id="hello-nav-script">
        {(gDom: any) => {
          const nav = document.getElementById("site-nav");
          if (!nav) return;

          const onScroll = () => {
            if (window.scrollY > 60) {
              nav.style.background = "rgba(15, 23, 42, 0.95)";
              nav.style.backdropFilter = "blur(12px)";
              nav.style.borderBottom = "1px solid rgba(255,255,255,0.08)";
            } else {
              nav.style.background = "transparent";
              nav.style.backdropFilter = "none";
              nav.style.borderBottom = "none";
            }
          };

          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        }}
      </Script>
    </header>
  );
};

export default HelloNav;
