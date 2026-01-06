import { Metadata } from "next";
import { BotsListClient } from "./BotsListClient";

export const metadata: Metadata = {
  title: "Bots | Seed",
  description: "Découvrez les bots automatisés qui alimentent Seed",
};

export default function BotsPage() {
  return <BotsListClient />;
}

