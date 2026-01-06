import { Metadata } from "next";
import { UserProfileClient } from "./UserProfileClient";

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

