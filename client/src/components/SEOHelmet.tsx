import { Helmet } from "react-helmet-async";

interface SEOHelmetProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
}

export function SEOHelmet({ title, description, path = "/", image }: SEOHelmetProps) {
  const url = `https://nearbytraveler.org${path}`;
  const ogImage = image || "https://nearbytraveler.org/og-image.png";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
