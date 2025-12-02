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
      <div className="border-b border-border/60 pb-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-2">
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
    <div className="border-b border-border/60 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">Actions en cours</h3>
        <Link href="/actions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Voir tout
        </Link>
      </div>
      <div className="space-y-0">
        {actions.slice(0, 3).map((action, index) => (
          <div key={action._id}>
            <Link
              href={`/actions/${action.slug}`}
              className="block py-2.5 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground uppercase">
                    {getActionTypeLabel(action.type)}
                  </span>
                  {action.deadline && (
                    <>
                      <span className="text-[11px] text-muted-foreground">•</span>
                      <span className="text-[11px] text-muted-foreground">
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
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <SolarIcon icon="users-group-two-rounded-bold" className="h-3 w-3" />
                  <span>{action.participants || 0} participants</span>
                </div>
              </div>
            </Link>
            {index < Math.min(actions.length, 3) - 1 && <Separator className="border-border/60" />}
          </div>
        ))}
      </div>
    </div>
  );
}

