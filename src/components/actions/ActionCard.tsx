"use client";

import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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

  return (
    <Link href={`/actions/${action.slug}`}>
      <article className="group cursor-pointer">
        {/* Image placeholder */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-4 bg-muted">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
            <SolarIcon icon={getTypeIcon() as any} className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Contenu */}
        <div className="space-y-2.5">
          {/* Type et statut */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
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
              className="text-[10px] px-1.5 py-0.5 h-5"
            >
              {STATUS_LABELS[action.status]}
            </Badge>
            {action.featured && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
                <SolarIcon icon="star-bold" className="h-2.5 w-2.5 mr-0.5" />
                En vedette
              </Badge>
            )}
          </div>

          {/* Titre */}
          <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {action.title}
          </h3>

          {/* Résumé */}
          {action.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {action.summary}
            </p>
          )}

          {/* Tags et métadonnées */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {action.tags && action.tags.length > 0 && (
              <>
                {action.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </>
            )}
            {(action.participants > 0 || action.deadline) && (
              <>
                {action.tags && action.tags.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">•</span>
                )}
                {action.participants > 0 && (
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <SolarIcon icon="users-group-two-rounded-bold" className="h-3 w-3" />
                    {action.participants}
                  </span>
                )}
                {action.deadline && (
                  <>
                    {action.participants > 0 && (
                      <span className="text-[11px] text-muted-foreground">•</span>
                    )}
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <SolarIcon icon="calendar-bold" className="h-3 w-3" />
                      {formatDistanceToNow(new Date(action.deadline), { addSuffix: true, locale: fr })}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

