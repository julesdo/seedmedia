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
    const action = await convex.query(api.actions.getActionBySlug, {
      slug,
    });

    if (!action) {
      return {
        title: "Action non trouvée | Seed",
      };
    }

    // Convertir l'image de couverture en URL absolue
    let ogImage = `${baseUrl}/og-image.png`;
    if (action.coverImage) {
      if (action.coverImage.startsWith("http://") || action.coverImage.startsWith("https://")) {
        ogImage = action.coverImage;
      } else {
        // Vérifier si c'est un storageId Convex
        const isStorageId = /^[a-z0-9]{20,}$/.test(action.coverImage);
        if (isStorageId) {
          try {
            const fileUrl = await convex.query(api.storage.getFileUrl, {
              storageId: action.coverImage as any,
            });
            if (fileUrl) {
              ogImage = fileUrl;
            }
          } catch (error) {
            console.error("Error getting file URL:", error);
          }
        } else {
          // URL relative
          ogImage = action.coverImage.startsWith("/")
            ? `${baseUrl}${action.coverImage}`
            : `${baseUrl}/${action.coverImage}`;
        }
      }
    }

    const url = `${baseUrl}/actions/${slug}`;
    const description = action.summary || action.description || action.title;

    return {
      title: `${action.title} | Seed`,
      description,
      openGraph: {
        title: action.title,
        description,
        url,
        siteName: "Seed",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: action.title,
          },
        ],
        locale: "fr_FR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: action.title,
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
      title: "Action | Seed",
    };
  }
}

export default function ActionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

