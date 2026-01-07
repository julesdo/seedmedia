import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

export default function ActionsFeaturePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Actions</h1>
        <p className="text-lg text-muted-foreground">
          Pétitions, contributions et événements pour mobiliser la communauté
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Types d'actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Pétitions</h4>
                <p className="text-sm text-muted-foreground">
                  Créez des pétitions et collectez des signatures pour porter vos revendications.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Appels à contribution</h4>
                <p className="text-sm text-muted-foreground">
                  Mobilisez la communauté autour d'un projet ou d'une cause.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Événements</h4>
                <p className="text-sm text-muted-foreground">
                  Organisez des événements et suivez les participants.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

