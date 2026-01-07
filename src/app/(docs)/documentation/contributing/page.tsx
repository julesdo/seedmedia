import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

export default function ContributingPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Contribuer à Seed</h1>
        <p className="text-lg text-muted-foreground">
          Seed est open source et nous accueillons toutes les contributions
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Types de contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <SolarIcon icon="bug-bold" className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Rapports de bugs</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Signalez les problèmes que vous rencontrez
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <SolarIcon icon="lightbulb-bold" className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Suggestions</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Proposez de nouvelles fonctionnalités
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <SolarIcon icon="document-text-bold" className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Documentation</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Améliorez la documentation
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <SolarIcon icon="code-bold" className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Code</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ajoutez des fonctionnalités ou corrigez des bugs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment contribuer</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
              <li>Fork le dépôt GitHub</li>
              <li>Créez une branche pour votre fonctionnalité</li>
              <li>Commitez vos changements</li>
              <li>Pushez vers votre branche</li>
              <li>Ouvrez une Pull Request</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Seed est distribué sous la <strong className="text-foreground">GNU Affero General Public License v3.0 (AGPL-3.0)</strong>.
              Cette licence garantit que le code reste libre et accessible, tout en empêchant l'utilisation
              commerciale sans partager les modifications.
            </p>
            <Button asChild variant="outline">
              <Link href="/documentation/licence">
                Lire la licence complète
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

