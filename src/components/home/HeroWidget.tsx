"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function HeroWidget() {
  const openDebates = useQuery(api.debates.getOpenDebates, { limit: 3 });
  const latestActions = useQuery(api.actions.getActions, { limit: 3, status: "active" });

  // Prioriser les débats, sinon les actions
  const content = openDebates && openDebates.length > 0 
    ? { type: "debates", items: openDebates }
    : latestActions && latestActions.length > 0
    ? { type: "actions", items: latestActions }
    : null;

  if (!content) {
    return (
      <div className="border-b border-border/60 pb-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
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
        <h3 className="font-bold text-base">
          {content.type === "debates" ? "Débats en cours" : "Actions récentes"}
        </h3>
        <Link 
          href={content.type === "debates" ? "/debats" : "/actions"} 
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Voir tout
        </Link>
      </div>
      <div className="space-y-0">
        {content.items.slice(0, 2).map((item: any, index: number) => (
          <div key={item._id}>
            <Link
              href={content.type === "debates" ? `/debats/${item.slug}` : `/actions/${item.slug}`}
              className="block py-2.5 group"
            >
              <div className="space-y-1">
                {content.type === "debates" ? (
                  <>
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:opacity-80 transition-opacity">
                      {item.question}
                    </h4>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <SolarIcon icon="check-circle-bold" className="h-3 w-3 text-green-500" />
                        {item.argumentsForCount || 0} pour
                      </span>
                      <span className="flex items-center gap-1">
                        <SolarIcon icon="close-circle-bold" className="h-3 w-3 text-red-500" />
                        {item.argumentsAgainstCount || 0} contre
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground uppercase">
                        {getActionTypeLabel(item.type)}
                      </span>
                      {item.deadline && (
                        <>
                          <span className="text-[11px] text-muted-foreground">•</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(item.deadline), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:opacity-80 transition-opacity">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <SolarIcon icon="users-group-two-rounded-bold" className="h-3 w-3" />
                      <span>{item.participants || 0} participants</span>
                    </div>
                  </>
                )}
              </div>
            </Link>
            {index < Math.min(content.items.length, 2) - 1 && <Separator className="border-border/60" />}
          </div>
        ))}
      </div>
    </div>
  );
}

