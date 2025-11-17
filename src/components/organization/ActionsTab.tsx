"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

interface ActionsTabProps {
  organizationId: Id<"organizations">;
}

export function ActionsTab({ organizationId }: ActionsTabProps) {
  const actions = useQuery(api.organizations.getOrganizationActionsPublic, {
    organizationId,
  });

  if (actions === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SolarIcon icon="handshake-bold" className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Aucune action</EmptyTitle>
          <EmptyDescription>
            Cette organisation n'a pas encore créé d'actions.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const typeLabels: Record<string, string> = {
    petition: "Pétition",
    contribution: "Contribution",
    event: "Événement",
  };

  const typeIcons: Record<string, string> = {
    petition: "document-add-bold",
    contribution: "hand-money-bold",
    event: "calendar-bold",
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <Card key={action._id} className="hover:border-primary/30 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <SolarIcon
                    icon={typeIcons[action.type] as any}
                    className="h-5 w-5 text-primary"
                  />
                  <Badge variant="outline">{typeLabels[action.type]}</Badge>
                </div>
                <CardTitle className="text-gradient-light">{action.title}</CardTitle>
                <p className="text-sm text-muted-foreground opacity-80">{action.summary}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {action.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground opacity-70">
                <div className="flex items-center gap-1">
                  <SolarIcon icon="users-group-rounded-bold" className="h-4 w-4" />
                  <span>{action.participants} participants</span>
                </div>
                {action.deadline && (
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="calendar-bold" className="h-4 w-4" />
                    <span>Jusqu'au {formatDate(action.deadline)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Link href={`/actions/${action.slug}`}>
                <Button variant="accent" icon="arrow-right-bold">
                  Voir l'action
                </Button>
              </Link>
              {action.link && (
                <Button
                  variant="glass"
                  asChild
                  icon="link-bold"
                >
                  <a href={action.link} target="_blank" rel="noopener noreferrer">
                    Site externe
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

