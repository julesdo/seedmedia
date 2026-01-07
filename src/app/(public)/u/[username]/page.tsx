import { Metadata } from "next";
import { UserProfileClient } from "./UserProfileClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// ISR: Régénérer toutes les 10 minutes (profils qui changent moins fréquemment)
export const revalidate = 600;

export async function generateStaticParams() {
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
    console.error("Error generating static params for user profiles:", error);
    // En cas d'erreur, retourner un tableau vide (fallback vers génération à la demande)
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

