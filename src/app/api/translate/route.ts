import { NextRequest, NextResponse } from "next/server";

/**
 * Route API pour traduire du texte
 * Utilise LibreTranslate (gratuit, open source, pas besoin de clé API)
 * Fallback sur MyMemory si LibreTranslate échoue
 */
export async function POST(req: NextRequest) {
  try {
    const { text, sourceLanguage, targetLanguage } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Si les langues sont identiques, retourner le texte original
    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ translatedText: text });
    }

    // Option 1: LibreTranslate (gratuit, open source, pas besoin de clé API)
    // Instance publique : https://libretranslate.com
    // Vous pouvez aussi héberger votre propre instance
    const LIBRETRANSLATE_URLS = [
      "https://libretranslate.com/translate",
      "https://translate.argosopentech.com/translate", // Instance alternative
    ];

    for (const url of LIBRETRANSLATE_URLS) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            source: sourceLanguage,
            target: targetLanguage,
            format: "text",
          }),
          // Timeout de 5 secondes
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.translatedText && data.translatedText !== text) {
            return NextResponse.json({ translatedText: data.translatedText });
          }
        }
      } catch (error) {
        // Essayer l'instance suivante
        continue;
      }
    }

    // Option 2: MyMemory Translation API (gratuit, 10000 caractères/jour)
    // Pas besoin de clé API pour l'usage de base
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`,
        {
          headers: {
            "User-Agent": "Seed Media App",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
          const translated = data.responseData.translatedText;
          // MyMemory peut retourner des warnings si le texte est trop long
          if (translated && !translated.includes("MYMEMORY WARNING") && translated !== text) {
            return NextResponse.json({ translatedText: translated });
          }
        }
      }
    } catch (error) {
      // Ignorer et continuer
    }

    // Si toutes les APIs échouent, retourner le texte original
    return NextResponse.json({ translatedText: text });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}

