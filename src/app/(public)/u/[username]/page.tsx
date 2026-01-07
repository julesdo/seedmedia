import { Metadata } from "next";
import { UserProfileClient } from "./UserProfileClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// ISR: Régénérer toutes les 10 minutes (profils qui changent moins fréquemment)
export const revalidate = 600;
// Forcer le mode statique pour éviter DYNAMIC_SERVER_USAGE
export const dynamic = 'force-static';
export const dynamicParams = true; // Permettre la génération à la demande pour les nouveaux usernames

export async function generateStaticParams() {
  // Avec dynamic = 'force-static', generateStaticParams ne devrait s'exécuter qu'au build time
  // Mais pour être sûr, on catch les erreurs et on retourne un tableau vide au runtime
  try {
    // Appeler directement Convex depuis le serveur
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Récupérer les usernames des 50 profils les plus populaires pour pré-génération
    const usernames = await convex.query(api.users.getPopularUserUsernames, {
      limit: 50,
    });
    
    return usernames.map((item: { username: string }) => ({
      username: item.username,
    }));
  } catch (error) {
    // En cas d'erreur (y compris DYNAMIC_SERVER_USAGE au runtime), retourner un tableau vide
    // Les pages seront générées à la demande grâce à dynamicParams = true
    console.error("Error generating static params for user profiles:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  
  return {
    title: `@${username} | Seed`,
    description: `Profil de @${username} sur Seed`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  
  return <UserProfileClient username={username} />;
}

