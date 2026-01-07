import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

async function getLicenseContent() {
  try {
    const licensePath = join(process.cwd(), "LICENSE");
    const licenseContent = readFileSync(licensePath, "utf-8");
    return licenseContent;
  } catch (error) {
    return "Impossible de charger le fichier de licence.";
  }
}

export default async function LicencePage() {
  const licenseContent = await getLicenseContent();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <SolarIcon icon="shield-check-bold" className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Licence</h1>
        <p className="text-lg text-muted-foreground">
          Seed est distribué sous licence AGPL-3.0
        </p>
      </div>

      {/* Résumé */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>GNU Affero General Public License v3.0 (AGPL-3.0)</CardTitle>
          <CardDescription>
            Licence open source pour Seed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Seed est distribué sous la <strong className="text-foreground">GNU Affero General Public License v3.0 (AGPL-3.0)</strong>.
            Cette licence garantit que le code reste libre et accessible, tout en empêchant l'utilisation
            commerciale sans partager les modifications.
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Pourquoi l'AGPL-3.0 ?</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Garantit la liberté : Le code source reste libre et accessible</li>
              <li>Empêche la privatisation : Interdit l'utilisation commerciale sans partager le code</li>
              <li>Protège contre la copie malveillante : Toute modification doit être partagée</li>
              <li>Assure la transparence : Même les services en ligne doivent partager leur code</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Licence complète */}
      <Card>
        <CardHeader>
          <CardTitle>Texte complet de la licence</CardTitle>
          <CardDescription>
            Licence AGPL-3.0 avec conditions additionnelles pour Seed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded-lg overflow-x-auto w-full">
              {licenseContent}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Liens utiles */}
      <div className="mt-8 flex gap-4 justify-center">
        <Button asChild variant="outline">
          <Link href="/documentation">
            <SolarIcon icon="document-text-bold" className="h-4 w-4 mr-2" />
            Documentation
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">
            <SolarIcon icon="external-link-bold" className="h-4 w-4 mr-2" />
            AGPL-3.0 sur gnu.org
          </a>
        </Button>
      </div>
    </div>
  );
}

