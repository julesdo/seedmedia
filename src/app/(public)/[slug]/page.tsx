import { Metadata } from "next";
import { DecisionDetailClient } from "./DecisionDetailClient";

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

