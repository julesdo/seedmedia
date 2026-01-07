import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

export default function CredibilityFeaturePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Système de crédibilité</h1>
        <p className="text-lg text-muted-foreground">
          Système de réputation basé sur la qualité des contributions
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Comment ça fonctionne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Le système de crédibilité récompense les contributions de qualité. Plus vous contribuez de manière qualitative, 
              plus votre crédibilité augmente.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Points de crédibilité pour contributions de qualité</li>
              <li>Niveaux de progression</li>
              <li>Badges de reconnaissance</li>
              <li>Transparence totale sur les scores</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

