import { NextRequest, NextResponse } from "next/server";

/**
 * Route API pour traduire plusieurs textes en batch
 * Utilise LibreTranslate (gratuit, open source) avec fallback sur MyMemory
 */
export async function POST(req: NextRequest) {
  try {
    const { texts, sourceLanguage, targetLanguage } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "Texts array is required" },
        { status: 400 }
      );
    }

    // Si les langues sont identiques, retourner les textes originaux
    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ translatedTexts: texts });
    }

    // Utiliser MyMemory directement (plus fiable que LibreTranslate)
    // Traduire tous les textes en parallèle
    const translatedTexts = await Promise.all(
      texts.map(async (text: string) => {
        try {
          const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`,
            {
              headers: {
                "User-Agent": "Seed Media App",
              },
              signal: AbortSignal.timeout(10000),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.responseData && data.responseData.translatedText) {
              const translated = data.responseData.translatedText;
              if (!translated.includes("MYMEMORY WARNING") && translated !== text && translated.length > 0) {
                console.log(`[MyMemory] "${text.substring(0, 50)}" -> "${translated.substring(0, 50)}"`);
                return translated;
              }
            }
          }
        } catch (error) {
          console.error(`[MyMemory] Error for "${text.substring(0, 50)}":`, error);
        }
        return text;
      })
    );

    return NextResponse.json({ translatedTexts });
  } catch (error) {
    console.error("Batch translation API error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}

