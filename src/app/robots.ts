import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seed.media";
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/studio/",
          "/admin/",
          "/api/",
          "/editor/",
          "/sign-in",
          "/sign-up",
          "/reset-password",
          "/callback",
          "/oauth-callback",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

