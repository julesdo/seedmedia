import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Démarrer avec Seed</h1>
        <p className="text-lg text-muted-foreground">
          Guide rapide pour commencer à utiliser Seed
        </p>
      </div>

      <div className="space-y-8">
        {/* Qu'est-ce que Seed */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="question-circle-bold" className="h-6 w-6 text-primary" />
                Qu'est-ce que Seed ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Seed est une plateforme d'information et d'utilité publique</strong> où la communauté publie, organise, vérifie et fait évoluer les contenus grâce à une gouvernance partagée.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <SolarIcon icon="check-circle-bold" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Pas d'algorithmes opaques</p>
                    <p className="text-sm text-muted-foreground">Toutes les règles sont transparentes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <SolarIcon icon="check-circle-bold" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Gouvernance démocratique</p>
                    <p className="text-sm text-muted-foreground">La communauté décide</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <SolarIcon icon="check-circle-bold" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Open source</p>
                    <p className="text-sm text-muted-foreground">Code libre et accessible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <SolarIcon icon="check-circle-bold" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Association loi 1901</p>
                    <p className="text-sm text-muted-foreground">Structure à but non lucratif</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Créer un compte */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="user-plus-bold" className="h-6 w-6 text-primary" />
                Créer un compte
              </CardTitle>
              <CardDescription>
                Rejoignez la communauté Seed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-2">
                <li>
                  <strong className="text-foreground">Cliquez sur "S'inscrire"</strong> dans le header
                </li>
                <li>
                  <strong className="text-foreground">Choisissez votre méthode d'authentification</strong> (email, Google, GitHub)
                </li>
                <li>
                  <strong className="text-foreground">Complétez votre profil</strong> avec vos informations
                </li>
                <li>
                  <strong className="text-foreground">Commencez à explorer</strong> et contribuer
                </li>
              </ol>
              <Button asChild variant="accent" className="mt-4">
                <Link href="/sign-up">
                  Créer un compte
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Premiers pas */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="compass-bold" className="h-6 w-6 text-primary" />
                Vos premiers pas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <SolarIcon icon="document-text-bold" className="h-4 w-4 text-primary" />
                  Lire des articles
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Explorez les articles publiés par la communauté, filtrez par catégorie, type ou tags.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/articles">
                    Explorer les articles
                  </Link>
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <SolarIcon icon="pen-bold" className="h-4 w-4 text-primary" />
                  Publier votre premier article
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Partagez vos connaissances avec la communauté. Chaque article peut être vérifié et amélioré collectivement.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/studio/articles/nouveau">
                    Créer un article
                  </Link>
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <SolarIcon icon="vote-bold" className="h-4 w-4 text-primary" />
                  Participer à la gouvernance
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Votez sur les propositions, créez vos propres propositions pour faire évoluer la plateforme.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/gouvernance">
                    Voir les propositions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Prochaines étapes */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="arrow-right-bold" className="h-6 w-6 text-primary" />
                Prochaines étapes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="accent" className="h-auto py-4 flex-col items-start">
                  <Link href="/documentation/features">
                    <div className="flex items-center gap-2 mb-2">
                      <SolarIcon icon="widget-bold" className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Fonctionnalités</span>
                    </div>
                    <span className="text-sm text-muted-foreground text-left">
                      Découvrez toutes les fonctionnalités
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="accent" className="h-auto py-4 flex-col items-start">
                  <Link href="/documentation/contributing">
                    <div className="flex items-center gap-2 mb-2">
                      <SolarIcon icon="heart-bold" className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Contribuer</span>
                    </div>
                    <span className="text-sm text-muted-foreground text-left">
                      Participer au développement
                    </span>
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

