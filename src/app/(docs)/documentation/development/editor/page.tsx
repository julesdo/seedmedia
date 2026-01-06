import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";

/**
 * Page de documentation de l'éditeur
 * L'éditeur a été supprimé dans la refonte, cette page est conservée pour la documentation
 */
export default function EditorDocumentationPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Éditeur de contenu</CardTitle>
          <CardDescription>
            L'éditeur de contenu a été supprimé dans la refonte de Seed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Dans la nouvelle version simplifiée de Seed, l'éditeur de contenu n'est plus disponible.
              Seed se concentre maintenant sur le suivi automatique des décisions politiques, économiques et diplomatiques.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <SolarIcon name="info-circle" className="size-3 mr-1" />
                Fonctionnalité supprimée
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
