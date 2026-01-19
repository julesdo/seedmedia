import { NextRequest, NextResponse } from "next/server";

/**
 * API Route pour récupérer les actualités depuis Google News RSS
 * Agit comme un proxy pour éviter les problèmes CORS côté client
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    // Construire l'URL Google News RSS
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=fr&gl=FR&ceid=FR:fr`;

    // Récupérer le flux RSS
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 }, // Cache 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }

    const xml = await response.text();

    // Parser le RSS (format simplifié)
    const items: Array<{
      title: string;
      link: string;
      pubDate: string;
      source: string;
      snippet?: string;
    }> = [];

    // Extraire les items
    const itemMatches = xml.matchAll(
      /<item>([\s\S]*?)<\/item>/gi
    );

    for (const match of itemMatches) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/i);

      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
          source: sourceMatch ? sourceMatch[1].trim() : "Google News",
          snippet: undefined, // Google News RSS ne fournit pas toujours de description
        });
      }
    }

    return NextResponse.json(items.slice(0, 10)); // Limiter à 10 articles
  } catch (error) {
    console.error("Error fetching RSS:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

