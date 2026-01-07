import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

export default function ProjectsFeaturePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Projets</h1>
        <p className="text-lg text-muted-foreground">
          Gestion et suivi des projets de la communauté
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Stages de développement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">Idée</Badge>
                <span className="text-sm text-muted-foreground">Projet en phase de conception</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Prototype</Badge>
                <span className="text-sm text-muted-foreground">Première version fonctionnelle</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Bêta</Badge>
                <span className="text-sm text-muted-foreground">Version testée par la communauté</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Production</Badge>
                <span className="text-sm text-muted-foreground">Projet en production</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

