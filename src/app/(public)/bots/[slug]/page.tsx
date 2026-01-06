import { Metadata } from "next";
import { BotDetailClient } from "./BotDetailClient";

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

