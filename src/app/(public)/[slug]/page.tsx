import { Metadata } from "next";
import { DecisionDetailClient } from "./DecisionDetailClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// ISR: Régénérer toutes les 2 minutes (page très visitée, données qui changent fréquemment)
export const revalidate = 120;
// Forcer le mode statique pour éviter DYNAMIC_SERVER_USAGE
export const dynamic = 'force-static';
export const dynamicParams = true; // Permettre la génération à la demande pour les nouveaux slugs

export async function generateStaticParams() {
  // Avec dynamic = 'force-static', generateStaticParams ne devrait s'exécuter qu'au build time
  // Mais pour être sûr, on catch les erreurs et on retourne un tableau vide au runtime
  try {
    // Appeler directement Convex depuis le serveur
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Récupérer les slugs des 100 décisions les plus récentes pour pré-génération
    const slugs = await convex.query(api.decisions.getRecentDecisionSlugs, {
      limit: 100,
    });
    
    return slugs.map((item: { slug: string }) => ({
      slug: item.slug,
    }));
  } catch (error) {
    // En cas d'erreur (y compris DYNAMIC_SERVER_USAGE au runtime), retourner un tableau vide
    // Les pages seront générées à la demande grâce à dynamicParams = true
    console.error("Error generating static params for decisions:", error);
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

