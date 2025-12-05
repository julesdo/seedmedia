"use client";

import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

const ACTION_TYPE_LABELS = {
  petition: "Pétition",
  contribution: "Contribution",
  event: "Événement",
} as const;

const STATUS_LABELS = {
  active: "Active",
  completed: "Terminée",
  cancelled: "Annulée",
} as const;

interface ActionCardProps {
  action: {
    _id: string;
    slug: string;
    title: string;
    summary: string;
    type: "petition" | "contribution" | "event";
    status: "active" | "completed" | "cancelled";
    tags: string[];
    participants: number;
    deadline?: number | null;
    featured?: boolean;
    createdAt: number;
  };
}

export function ActionCard({ action }: ActionCardProps) {
  const getTypeIcon = () => {
    switch (action.type) {
      case "petition":
        return "pen-new-square-bold";
      case "contribution":
        return "hand-stars-bold";
      case "event":
        return "calendar-mark-bold";
    }
  };

  const getTypeColor = () => {
    switch (action.type) {
      case "petition":
        return "text-blue-600 dark:text-blue-400";
      case "contribution":
        return "text-purple-600 dark:text-purple-400";
      case "event":
        return "text-orange-600 dark:text-orange-400";
    }
  };

  return (
    <Link href={`/actions/${action.slug}`}>
      <article className="group border border-border/60 rounded-lg p-4 md:p-5 hover:border-primary/40 hover:bg-muted/20 transition-all h-full flex flex-col">
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Header avec icône et badges */}
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg bg-muted/50 ${getTypeColor()}`}>
                  <SolarIcon icon={getTypeIcon() as any} className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5">
                      {ACTION_TYPE_LABELS[action.type]}
                    </Badge>
                    <Badge
                      variant={
                        action.status === "active"
                          ? "default"
                          : action.status === "completed"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[10px] px-2 py-0.5 h-5"
                    >
                      {STATUS_LABELS[action.status]}
                    </Badge>
                    {action.featured && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5">
                        <SolarIcon icon="star-bold" className="h-2.5 w-2.5 mr-1" />
                        En vedette
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Titre */}
            <h3 className="text-base md:text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {action.title}
            </h3>

            {/* Résumé */}
            {action.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {action.summary}
              </p>
            )}
          </div>

          {/* Séparateur */}
          <Separator className="border-border/60" />

          {/* Tags et métadonnées */}
          <div className="flex-1 flex flex-col justify-end space-y-2.5">
            {action.tags && action.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {action.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
                {action.tags.length > 3 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{action.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Métriques */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              {action.participants > 0 && (
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="users-group-two-rounded-bold" className="h-3.5 w-3.5" />
                  <span className="font-medium">{action.participants}</span>
                  <span className="text-[11px]">participant{action.participants > 1 ? "s" : ""}</span>
                </div>
              )}
              {action.deadline && (
                <>
                  {action.participants > 0 && <span>•</span>}
                  <div className="flex items-center gap-1.5">
                    <SolarIcon icon="calendar-bold" className="h-3.5 w-3.5" />
                    <span className="text-[11px]">
                      {formatDistanceToNow(new Date(action.deadline), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
