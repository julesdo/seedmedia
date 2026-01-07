import { Metadata } from "next";
import { DecisionDetailClient } from "./DecisionDetailClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// ISR: Régénérer toutes les 2 minutes (page très visitée, données qui changent fréquemment)
export const revalidate = 120;

export async function generateStaticParams() {
  try {
    // Appeler directement Convex depuis le serveur (plus fiable que via API route)
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Récupérer les slugs des 100 décisions les plus récentes pour pré-génération
    const slugs = await convex.query(api.decisions.getRecentDecisionSlugs, {
      limit: 100,
    });
    
    return slugs.map((item: { slug: string }) => ({
      slug: item.slug,
    }));
  } catch (error) {
    console.error("Error generating static params for decisions:", error);
    // En cas d'erreur, retourner un tableau vide (fallback vers génération à la demande)
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  
  return {
    title: `Décision | Seed`,
    description: "Suivez les effets réels des décisions politiques, économiques et diplomatiques",
  };
}

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  return <DecisionDetailClient slug={slug} />;
}

