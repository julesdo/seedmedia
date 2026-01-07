import { Metadata } from "next";
import { RulesClient } from "./RulesClient";

// ISR: Régénérer toutes les 5 minutes (données qui changent peu)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Règles de Calcul | Seed",
  description:
    "Règles publiques et transparentes de calcul des issues et de distribution des Seeds dans Seed",
  openGraph: {
    title: "Règles de Calcul | Seed",
    description:
      "Règles publiques et transparentes de calcul des issues et de distribution des Seeds",
    type: "website",
  },
};

export default async function RulesPage() {
  return <RulesClient />;
}

