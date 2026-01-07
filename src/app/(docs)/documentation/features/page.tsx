import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ISR: Régénérer toutes les heures (contenu statique qui change rarement)
export const revalidate = 3600;

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Fonctionnalités</h1>
        <p className="text-lg text-muted-foreground">
          Découvrez toutes les fonctionnalités de Seed
        </p>
      </div>

      <div className="space-y-8">
        {/* Articles */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="document-text-bold" className="h-6 w-6 text-primary" />
                Articles
              </CardTitle>
              <CardDescription>
                Système de publication d'articles avec vérification et sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Publiez des articles vérifiés avec sources obligatoires. Chaque affirmation peut être sourcée et contestée par la communauté.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Rédaction collaborative avec éditeur riche</li>
                <li>Système de sources pour chaque affirmation</li>
                <li>Catégorisation et tags</li>
                <li>Scores de qualité automatiques</li>
                <li>Commentaires et débats</li>
                <li>Types d'articles : scientifique, expert, opinion, actualité, tutoriel</li>
              </ul>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/documentation/features/articles">
                  En savoir plus
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Gouvernance */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="settings-bold" className="h-6 w-6 text-primary" />
                Gouvernance
              </CardTitle>
              <CardDescription>
                Système de gouvernance démocratique où toutes les règles sont modifiables par vote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Seed fonctionne selon un modèle de gouvernance partagée où toutes les règles sont publiques, modifiables, votées et traçables.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Propositions de modifications des règles</li>
                <li>Votes transparents et publics</li>
                <li>Règles configurables modifiables par la communauté</li>
                <li>Historique complet des évolutions</li>
                <li>Transparence totale sur toutes les décisions</li>
              </ul>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/documentation/features/governance">
                  En savoir plus
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Débats */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="chat-round-bold" className="h-6 w-6 text-primary" />
                Débats
              </CardTitle>
              <CardDescription>
                Espaces de débat structurés avec arguments pour et contre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Créez des débats structurés où chaque argument doit être sourcé. Mesurez la polarisation et la qualité des échanges.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Arguments pour et contre avec sources obligatoires</li>
                <li>Scoring de polarisation pour mesurer la qualité</li>
                <li>Modération communautaire</li>
                <li>Liens avec les articles</li>
              </ul>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/documentation/features/debates">
                  En savoir plus
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Actions */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="hand-stars-bold" className="h-6 w-6 text-primary" />
                Actions
              </CardTitle>
              <CardDescription>
                Pétitions, contributions et événements pour mobiliser la communauté
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Organisez des actions collectives : pétitions, appels à contribution, événements.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Pétitions avec signatures</li>
                <li>Appels à contribution</li>
                <li>Organisation d'événements</li>
                <li>Suivi des participants</li>
              </ul>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/documentation/features/actions">
                  En savoir plus
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Projets */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="rocket-2-bold" className="h-6 w-6 text-primary" />
                Projets
              </CardTitle>
              <CardDescription>
                Gestion et suivi des projets de la communauté
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Suivez l'évolution des projets de la communauté, de l'idée à la production.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Stages de développement : Idée → Prototype → Bêta → Production</li>
                <li>Lien avec projets open source</li>
                <li>Système de contribution</li>
              </ul>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/documentation/features/projects">
                  En savoir plus
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Crédibilité */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <SolarIcon icon="star-bold" className="h-6 w-6 text-primary" />
                Système de crédibilité
              </CardTitle>
              <CardDescription>
                Système de réputation basé sur la qualité des contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Gagnez des points de crédibilité en contribuant de manière qualitative. Votre réputation reflète la qualité de vos contributions.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Points de crédibilité pour contributions de qualité</li>
                <li>Niveaux de progression</li>
                <li>Badges de reconnaissance</li>
                <li>Transparence totale sur les scores</li>
              </ul>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/documentation/features/credibility">
                  En savoir plus
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

