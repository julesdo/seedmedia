import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Valider l'URL
    const urlObj = new URL(url);
    
    // Ne pas permettre les URLs locales pour des raisons de sécurité
    if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
      return NextResponse.json(
        { error: "Local URLs are not allowed" },
        { status: 400 }
      );
    }

    // Récupérer les métadonnées OG de l'URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      // Timeout après 10 secondes
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Parser les métadonnées OG
    const metadata: {
      title?: string;
      description?: string;
      image?: string;
      siteName?: string;
    } = {};

    // Extraire le titre (priorité: og:title > twitter:title > <title>)
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const twitterTitleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    
    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1].trim();
    } else if (twitterTitleMatch) {
      metadata.title = twitterTitleMatch[1].trim();
    } else if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extraire la description (priorité: og:description > description > twitter:description)
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const twitterDescMatch = html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
    
    if (ogDescMatch) {
      metadata.description = ogDescMatch[1].trim();
    } else if (descMatch) {
      metadata.description = descMatch[1].trim();
    } else if (twitterDescMatch) {
      metadata.description = twitterDescMatch[1].trim();
    }

    // Extraire l'image (priorité: og:image > twitter:image)
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    
    if (ogImageMatch || twitterImageMatch) {
      let imageUrl = (ogImageMatch || twitterImageMatch)![1].trim();
      // Convertir les URLs relatives en absolues
      if (imageUrl.startsWith("//")) {
        imageUrl = `${urlObj.protocol}${imageUrl}`;
      } else if (imageUrl.startsWith("/")) {
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (!imageUrl.startsWith("http")) {
        imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
      }
      metadata.image = imageUrl;
    }

    // Extraire le nom du site
    const siteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
    if (siteMatch) {
      metadata.siteName = siteMatch[1].trim();
    }

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching link preview:", error);
    // Retourner des métadonnées minimales en cas d'erreur
    try {
      const urlObj = new URL(url);
      return NextResponse.json({
        title: urlObj.hostname,
        description: url,
        url: url,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch link preview" },
        { status: 500 }
      );
    }
  }
}


