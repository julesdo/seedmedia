import { Metadata } from "next";
import { RulesClient } from "./RulesClient";

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

