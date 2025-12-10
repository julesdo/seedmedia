import { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seed.media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const article = await convex.query(api.articles.getArticleBySlug, {
      slug,
    });

    if (!article || article.status !== "published") {
      return {
        title: "Article non trouvé | Seed",
      };
    }

    // Convertir l'image de couverture en URL absolue
    let ogImage = `${baseUrl}/og-image.png`;
    if (article.coverImage) {
      if (article.coverImage.startsWith("http://") || article.coverImage.startsWith("https://")) {
        ogImage = article.coverImage;
      } else {
        // Vérifier si c'est un storageId Convex (format: longue chaîne alphanumérique)
        const isStorageId = /^[a-z0-9]{20,}$/.test(article.coverImage);
        if (isStorageId) {
          try {
            const fileUrl = await convex.query(api.storage.getFileUrl, {
              storageId: article.coverImage as any,
            });
            if (fileUrl) {
              ogImage = fileUrl;
            }
          } catch (error) {
            console.error("Error getting file URL:", error);
            // Fallback sur l'image par défaut
          }
        } else {
          // URL relative
          ogImage = article.coverImage.startsWith("/")
            ? `${baseUrl}${article.coverImage}`
            : `${baseUrl}/${article.coverImage}`;
        }
      }
    }

    const url = `${baseUrl}/articles/${slug}`;
    const description = article.summary || article.title;

    return {
      title: `${article.title} | Seed`,
      description,
      openGraph: {
        title: article.title,
        description,
        url,
        siteName: "Seed",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        locale: "fr_FR",
        type: "article",
        ...(article.publishedAt && {
          publishedTime: new Date(article.publishedAt).toISOString(),
        }),
        ...(article.updatedAt && {
          modifiedTime: new Date(article.updatedAt).toISOString(),
        }),
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Article | Seed",
    };
  }
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

