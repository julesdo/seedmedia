import { Metadata } from "next";
import { BotDetailClient } from "./BotDetailClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// ISR: Régénérer toutes les 10 minutes (bots qui changent peu)
export const revalidate = 600;

export async function generateStaticParams() {
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
    console.error("Error generating static params for bots:", error);
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

