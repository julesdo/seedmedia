import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">API</h1>
        <p className="text-lg text-muted-foreground">
          Documentation de l'API Convex de Seed
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>API Convex</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Seed utilise Convex comme backend. L'API est générée automatiquement à partir des fonctions définies dans le dossier <code className="bg-muted px-1 rounded">convex/</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

