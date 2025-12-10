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
    const project = await convex.query(api.projects.getProjectBySlug, {
      slug,
    });

    if (!project) {
      return {
        title: "Projet non trouvé | Seed",
      };
    }

    // Convertir l'image de couverture en URL absolue
    let ogImage = `${baseUrl}/og-image.png`;
    const coverImage = project.images?.[0];
    if (coverImage) {
      if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
        ogImage = coverImage;
      } else {
        // Vérifier si c'est un storageId Convex
        const isStorageId = /^[a-z0-9]{20,}$/.test(coverImage);
        if (isStorageId) {
          try {
            const fileUrl = await convex.query(api.storage.getFileUrl, {
              storageId: coverImage as any,
            });
            if (fileUrl) {
              ogImage = fileUrl;
            }
          } catch (error) {
            console.error("Error getting file URL:", error);
          }
        } else {
          // URL relative
          ogImage = coverImage.startsWith("/")
            ? `${baseUrl}${coverImage}`
            : `${baseUrl}/${coverImage}`;
        }
      }
    }

    const url = `${baseUrl}/projets/${slug}`;
    const description = project.summary || project.description || project.title;

    return {
      title: `${project.title} | Seed`,
      description,
      openGraph: {
        title: project.title,
        description,
        url,
        siteName: "Seed",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: project.title,
          },
        ],
        locale: "fr_FR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: project.title,
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
      title: "Projet | Seed",
    };
  }
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

