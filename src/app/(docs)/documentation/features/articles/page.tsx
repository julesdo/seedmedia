import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ArticlesFeaturePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Articles</h1>
        <p className="text-lg text-muted-foreground">
          Système de publication d'articles avec vérification et sources
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Vue d'ensemble</CardTitle>
            <CardDescription>
              Les articles sont au cœur de Seed. Chaque article peut être vérifié, amélioré et débattu par la communauté.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Le système d'articles de Seed permet de publier du contenu vérifié avec des sources obligatoires. 
              Chaque affirmation peut être sourcée et contestée par la communauté, garantissant la qualité et la fiabilité de l'information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Types d'articles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Scientifique</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Articles basés sur des recherches scientifiques avec sources académiques
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Expert</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyses approfondies par des experts du domaine
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Opinion</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Points de vue et analyses personnelles
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Actualité</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Informations sur l'actualité avec sources vérifiées
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Tutoriel</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Guides pratiques et tutoriels étape par étape
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Système de vérification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Chaque affirmation dans un article peut être sourcée. La communauté peut vérifier ou contester chaque source, 
              garantissant la fiabilité de l'information.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Sources obligatoires pour chaque affirmation importante</li>
              <li>Vérification communautaire des sources</li>
              <li>Score de vérification automatique</li>
              <li>Possibilité de contester une source</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

