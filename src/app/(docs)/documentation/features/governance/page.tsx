import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Separator } from "@/components/ui/separator";

export default function GovernanceFeaturePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Gouvernance</h1>
        <p className="text-lg text-muted-foreground">
          Système de gouvernance démocratique où toutes les règles sont modifiables par vote
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Principe fondamental</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Seed fonctionne selon un modèle de <strong className="text-foreground">gouvernance partagée</strong> où toutes les règles sont publiques, modifiables, votées et traçables.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Types de propositions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Règles éditoriales</h4>
                <p className="text-sm text-muted-foreground">
                  Modifier les règles de publication, de modération, etc.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Évolutions produit</h4>
                <p className="text-sm text-muted-foreground">
                  Proposer de nouvelles fonctionnalités à la plateforme.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Règles configurables</h4>
                <p className="text-sm text-muted-foreground">
                  Modifier les paramètres techniques de la plateforme.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Autres</h4>
                <p className="text-sm text-muted-foreground">
                  Propositions libres de la communauté.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processus de vote</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-2">
              <li><strong className="text-foreground">Proposition</strong> : Un membre crée une proposition</li>
              <li><strong className="text-foreground">Discussion</strong> : La communauté débat sur la proposition</li>
              <li><strong className="text-foreground">Vote</strong> : Vote ouvert à tous les membres actifs</li>
              <li><strong className="text-foreground">Application</strong> : Si approuvée, la proposition est appliquée automatiquement</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transparence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-muted-foreground">
              <p>✅ Tous les votes sont publics</p>
              <p>✅ Tous les résultats sont traçables</p>
              <p>✅ Aucune décision n'est prise en secret</p>
              <p>✅ La communauté peut contester toute décision</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

