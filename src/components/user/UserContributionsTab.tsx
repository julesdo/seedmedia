"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface UserContributionsTabProps {
  corrections?: any[] | undefined;
}

export function UserContributionsTab({ corrections }: UserContributionsTabProps) {
  if (corrections === undefined) {
    return null;
  }

  if (corrections.length === 0) {
    return (
      <Empty>
        <EmptyMedia>
          <SolarIcon icon="verified-check-bold" className="h-12 w-12 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Aucune contribution</EmptyTitle>
          <EmptyDescription>
            Cet utilisateur n'a pas encore fait de contributions (corrections, sources, etc.).
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {corrections.map((correction) => (
        <Card key={correction._id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{correction.title}</h3>
                  <Badge
                    variant={
                      correction.status === "approved"
                        ? "default"
                        : correction.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {correction.status === "approved"
                      ? "Approuvée"
                      : correction.status === "rejected"
                      ? "Rejetée"
                      : "En attente"}
                  </Badge>
                </div>
                {correction.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {correction.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <SolarIcon icon="document-text-bold" className="h-3 w-3" />
                    {correction.correctionType === "source"
                      ? "Source"
                      : correction.correctionType === "contre_argument"
                      ? "Contre-argument"
                      : correction.correctionType === "fact_check"
                      ? "Fact-check"
                      : "Autre"}
                  </span>
                  {correction.createdAt && (
                    <span>
                      {formatDistanceToNow(new Date(correction.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  )}
                </div>
              </div>
              {correction.articleSlug && (
                <Link
                  href={`/articles/${correction.articleSlug}`}
                  className="text-sm text-primary hover:underline shrink-0"
                >
                  Voir l'article
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

