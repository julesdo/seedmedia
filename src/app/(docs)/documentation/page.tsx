import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

export default function DocumentationPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <SolarIcon icon="document-text-bold" className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Documentation Seed
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tout ce que vous devez savoir sur Seed, plateforme d'information et d'utilité publique
        </p>
        <div className="flex items-center justify-center gap-2 pt-4">
          <Badge variant="outline" className="text-sm">
            Open Source
          </Badge>
          <Badge variant="outline" className="text-sm">
            Association loi 1901
          </Badge>
        </div>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <Card className="group hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <SolarIcon icon="rocket-2-bold" className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Démarrer</CardTitle>
            </div>
            <CardDescription>
              Commencez à utiliser Seed en quelques minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="accent">
              <Link href="/documentation/getting-started">
                Commencer
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <SolarIcon icon="widget-bold" className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Fonctionnalités</CardTitle>
            </div>
            <CardDescription>
              Découvrez toutes les fonctionnalités de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="accent" className="w-full">
              <Link href="/documentation/features">
                Explorer
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <SolarIcon icon="target-bold" className="h-6 w-6 text-primary" />
            À propos de Seed
          </h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">Seed est une plateforme d'information et d'utilité publique</strong> où la communauté publie, organise, vérifie et fait évoluer les contenus grâce à une gouvernance partagée.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pas d'algorithmes opaques, pas de ligne éditoriale imposée. Seed fonctionne selon des principes de transparence totale et de démocratie participative.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <SolarIcon icon="settings-bold" className="h-6 w-6 text-primary" />
            Gouvernance
          </h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Seed fonctionne selon un modèle de <strong className="text-foreground">gouvernance partagée</strong> où toutes les règles sont publiques, modifiables, votées et traçables.
              </p>
              <Button asChild variant="ghost" className="mt-4">
                <Link href="/documentation/features/governance">
                  En savoir plus
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <SolarIcon icon="code-bold" className="h-6 w-6 text-primary" />
            Développement
          </h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Seed est open source et distribué sous licence AGPL-3.0. Contribuez au développement de la plateforme.
              </p>
              <div className="flex gap-3 mt-4">
                <Button asChild variant="outline">
                  <Link href="/documentation/development">
                    Guide d'installation
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/documentation/contributing">
                    Contribuer
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
