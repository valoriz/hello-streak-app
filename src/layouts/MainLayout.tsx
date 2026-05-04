import { WidgetPlaceholder } from "streak-forge/components";

// ─── WidgetPlaceholder ────────────────────────────────────────────────────────
// Marks a slot in the layout where a widget is injected at build time.
// id   must match the "id" field in streak.sitemap.json widgets[].
// type must match the "type" field AND the filename in src/widgets/.
// ─────────────────────────────────────────────────────────────────────────────

const MainLayout = () => {
  console.info("Rendering Main Layout");
  return (
    <html dir="ltr" lang="en">
      <head>
        <WidgetPlaceholder id="PageHead" type="PageHead" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        <WidgetPlaceholder id="HelloNav"      type="HelloNav"      />
        <WidgetPlaceholder id="HelloBanner"   type="HelloBanner"   />
        <WidgetPlaceholder id="HelloFeatures"  type="HelloFeatures"  />
        <WidgetPlaceholder id="HelloAnimated"  type="HelloAnimated"  />
        <WidgetPlaceholder id="HelloMessage"   type="HelloMessage"   />
        <WidgetPlaceholder id="HelloFooter"   type="HelloFooter"   />
      </body>
    </html>
  );
};

export default MainLayout;
