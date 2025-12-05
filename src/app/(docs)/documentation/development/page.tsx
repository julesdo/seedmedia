import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DevelopmentPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Installation et développement</h1>
        <p className="text-lg text-muted-foreground">
          Guide technique pour installer et développer Seed
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Prérequis</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Node.js (v18 ou supérieur)</li>
              <li>pnpm (recommandé) ou npm/yarn</li>
              <li>Convex CLI</li>
              <li>Compte Convex (gratuit)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
              <div># Cloner le dépôt</div>
              <div>git clone https://github.com/seedmedia/seed.git</div>
              <div>cd seed</div>
              <div className="mt-4"># Installer les dépendances</div>
              <div>pnpm install</div>
              <div className="mt-4"># Lancer le serveur de développement</div>
              <div>pnpm dev</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stack technique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Badge variant="outline">Next.js 16</Badge>
              <Badge variant="outline">React 19</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Convex</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
              <Badge variant="outline">shadcn/ui</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contribuer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Seed est open source. Contribuez au développement de la plateforme.
            </p>
            <Button asChild>
              <Link href="https://github.com/seedmedia/seed">
                <SolarIcon icon="github-bold" className="h-4 w-4 mr-2" />
                Voir le code source
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

