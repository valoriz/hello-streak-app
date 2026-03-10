import { Preload } from "streak/components";

type PageHeadProps = {
  data?: {
    title?: string;
    description?: string;
    heroImageUrl?: string;
  };
};

const PageHead = (props: PageHeadProps) => {
  const title = props?.data?.title ?? "Hello Streak";
  const description = props?.data?.description ?? "A Streak.js app";
  const heroImageUrl = props?.data?.heroImageUrl;

  return (
    <>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />

      {/*
        Preload: emits <link rel="preload"> so the browser fetches this
        resource before it is discovered in the HTML body.
        href  = URL to preload
        as    = resource type ("image" | "font" | "style" | "script" | "video")
        media = media query scope - "" means all screens
      */}
      <Preload href="/styles/tailwind.css" as="style" media="" />
      {heroImageUrl && (
        <Preload href={heroImageUrl} as="image" media="(min-width: 768px)" />
      )}

      <link rel="stylesheet" href="/styles/tailwind.css" />
      <link rel="icon" href="/images/streak-logo.svg" type="image/svg+xml" />
    </>
  );
};

export default PageHead;
