"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";

interface Action {
  icon: string;
  title: string;
  description: string;
  points: string;
  link?: string;
  linkLabel?: string;
}

const actions: Action[] = [
  {
    icon: "document-text-bold",
    title: "Publier des articles de qualité",
    description: "Publiez des articles avec un score de qualité élevé. Plus votre article est vérifié et sourcé, plus vous gagnez de points.",
    points: "Jusqu'à 30 points",
    link: "/studio/articles/nouveau",
    linkLabel: "Rédiger un article",
  },
  {
    icon: "link-bold",
    title: "Proposer des sources fiables",
    description: "Ajoutez des sources de qualité aux articles. Les sources avec un score de fiabilité élevé rapportent plus de points.",
    points: "Jusqu'à 20 points",
  },
  {
    icon: "like-bold",
    title: "Recevoir des votes positifs",
    description: "Gagnez des votes 'Solide' sur vos articles publiés. Chaque vote positif contribue à votre crédibilité.",
    points: "Jusqu'à 20 points",
  },
  {
    icon: "verified-check-bold",
    title: "Proposer des corrections approuvées",
    description: "Proposez des améliorations aux articles qui sont ensuite approuvées par les auteurs ou éditeurs.",
    points: "Jusqu'à 15 points",
  },
  {
    icon: "user-id-bold",
    title: "Développer votre expertise",
    description: "Obtenez le statut de Contributeur ou Éditeur, et déclarez vos domaines d'expertise pour gagner des points bonus.",
    points: "Jusqu'à 10 points",
  },
  {
    icon: "shield-check-bold",
    title: "Effectuer des vérifications",
    description: "Participez au fact-checking en vérifiant les claims des articles. Les vérifications d'experts rapportent plus de points.",
    points: "Jusqu'à 5 points",
  },
];

export function CredibilityActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comment gagner des points</CardTitle>
        <CardDescription>
          Découvrez toutes les actions qui contribuent à votre score de crédibilité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {actions.map((action, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <SolarIcon icon={action.icon as any} className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold">{action.title}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {action.points}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {action.description}
                  </p>
                  {action.link && (
                    <Link
                      href={action.link}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {action.linkLabel}
                      <SolarIcon icon="arrow-right-bold" className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

