import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebatesFeaturePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Débats</h1>
        <p className="text-lg text-muted-foreground">
          Espaces de débat structurés avec arguments pour et contre
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Vue d'ensemble</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les débats sur Seed sont structurés pour favoriser des échanges de qualité. Chaque argument doit être sourcé, 
              et le système mesure la polarisation pour encourager la nuance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Structure des débats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Arguments pour et contre avec sources obligatoires</li>
              <li>Scoring de polarisation pour mesurer la qualité</li>
              <li>Modération communautaire</li>
              <li>Liens avec les articles</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

