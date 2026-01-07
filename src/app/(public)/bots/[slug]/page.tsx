import { Metadata } from "next";
import { BotDetailClient } from "./BotDetailClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// ISR: Régénérer toutes les 10 minutes (bots qui changent peu)
export const revalidate = 600;
// Forcer le mode statique pour éviter DYNAMIC_SERVER_USAGE
export const dynamic = 'force-static';
export const dynamicParams = true; // Permettre la génération à la demande pour les nouveaux bots

export async function generateStaticParams() {
  // Avec dynamic = 'force-static', generateStaticParams ne devrait s'exécuter qu'au build time
  // Mais pour être sûr, on catch les erreurs et on retourne un tableau vide au runtime
  try {
    // Appeler directement Convex depuis le serveur
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Récupérer tous les bots actifs pour pré-génération
    const bots = await convex.query(api.bots.getBots, {
      active: true,
    });
    
    return bots.map((bot) => ({
      slug: bot.slug,
    }));
  } catch (error) {
    // En cas d'erreur (y compris DYNAMIC_SERVER_USAGE au runtime), retourner un tableau vide
    // Les pages seront générées à la demande grâce à dynamicParams = true
    console.error("Error generating static params for bots:", error);
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
    title: `Bot ${slug} | Seed`,
    description: `Détails du bot ${slug} sur Seed`,
  };
}

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  return <BotDetailClient slug={slug} />;
}

