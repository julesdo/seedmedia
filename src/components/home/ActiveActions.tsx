"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function ActiveActions() {
  const actions = useQuery(api.actions.getActions, {
    limit: 5,
    status: "active",
  });

  if (!actions) {
    return (
      <div className="border-b border-border pb-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case "petition":
        return "Pétition";
      case "contribution":
        return "Contribution";
      case "event":
        return "Événement";
      default:
        return type;
    }
  };

  return (
    <div className="border-b border-border pb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">Actions en cours</h3>
        <Link href="/actions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Voir tout
        </Link>
      </div>
      <div className="space-y-0">
        {actions.slice(0, 3).map((action, index) => (
          <div key={action._id}>
            <Link
              href={`/actions/${action.slug}`}
              className="block py-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase">
                    {getActionTypeLabel(action.type)}
                  </span>
                  {action.deadline && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(action.deadline), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </>
                  )}
                </div>
                <h4 className="font-semibold text-sm line-clamp-2 group-hover:opacity-80 transition-opacity">
                  {action.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <SolarIcon icon="users-group-two-rounded-bold" className="h-3 w-3" />
                  <span>{action.participants || 0} participants</span>
                </div>
              </div>
            </Link>
            {index < Math.min(actions.length, 3) - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  );
}

