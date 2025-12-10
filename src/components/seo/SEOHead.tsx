"use client";

import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "article" | "website" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  structuredData?: object;
  canonical?: string;
}

export function SEOHead({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags,
  structuredData,
  canonical,
}: SEOHeadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seed.media";
  const fullUrl = url ? (url.startsWith("http") ? url : `${baseUrl}${url}`) : baseUrl;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${baseUrl}${image}`
    : `${baseUrl}/og-image.png`;
  const canonicalUrl = canonical ? (canonical.startsWith("http") ? canonical : `${baseUrl}${canonical}`) : fullUrl;

  useEffect(() => {
    // Mettre à jour le titre de la page
    if (title) {
      document.title = `${title} | Seed`;
    }

    // Mettre à jour ou créer les meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    if (description) {
      updateMetaTag("description", description);
      updateMetaTag("og:description", description, true);
      updateMetaTag("twitter:description", description);
    }

    if (title) {
      updateMetaTag("og:title", title, true);
      updateMetaTag("twitter:title", title);
    }

    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:image:url", ogImage, true);
    updateMetaTag("og:image:width", "1200", true);
    updateMetaTag("og:image:height", "630", true);
    updateMetaTag("og:image:type", "image/png", true);
    updateMetaTag("og:image:alt", title || "Seed", true);
    updateMetaTag("twitter:image", ogImage);
    updateMetaTag("twitter:image:alt", title || "Seed");
    updateMetaTag("og:url", fullUrl, true);
    updateMetaTag("og:type", type, true);

    if (publishedTime) {
      updateMetaTag("article:published_time", publishedTime, true);
    }

    if (modifiedTime) {
      updateMetaTag("article:modified_time", modifiedTime, true);
    }

    if (author) {
      updateMetaTag("article:author", author, true);
    }

    if (tags && tags.length > 0) {
      tags.forEach((tag, index) => {
        updateMetaTag(`article:tag`, tag, true);
      });
    }

    // Mettre à jour le lien canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // Injecter les données structurées JSON-LD
    if (structuredData) {
      let script = document.getElementById("structured-data");
      if (!script) {
        script = document.createElement("script");
        script.id = "structured-data";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [
    title,
    description,
    ogImage,
    fullUrl,
    type,
    publishedTime,
    modifiedTime,
    author,
    tags,
    structuredData,
    canonicalUrl,
  ]);

  return null;
}

