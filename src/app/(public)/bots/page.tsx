import { Metadata } from "next";
import { BotsListClient } from "./BotsListClient";

// ISR: Régénérer toutes les 5 minutes (données qui changent peu)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bots | Seed",
  description: "Découvrez les bots automatisés qui alimentent Seed",
};

export default function BotsPage() {
  return <BotsListClient />;
}

