import { SimplifiedLayout } from "./simplified-layout";

/**
 * Layout simplifié pour Seed
 * Utilise BottomNav (mobile) et SimplifiedHeader (desktop)
 * Maximum 2 clics pour toute action principale
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SimplifiedLayout>{children}</SimplifiedLayout>;
}

