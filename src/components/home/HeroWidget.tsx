"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "next-view-transitions";
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
      <div className="h-full flex flex-col">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex-1 space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
    <div className="h-full flex flex-col">
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
      <div className="flex-1 space-y-0">
        {content.items.slice(0, 2).map((item: any, index: number) => (
          <div key={item._id}>
            <Link
              href={content.type === "debates" ? `/debats/${item.slug}` : `/actions/${item.slug}`}
              className="block py-3 group"
            >
              <div className="space-y-2.5">
                {content.type === "debates" ? (
                  <>
                    <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.question}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.argumentsForCount || 0} pour</span>
                      <span>•</span>
                      <span>{item.argumentsAgainstCount || 0} contre</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="uppercase">{getActionTypeLabel(item.type)}</span>
                        {item.deadline && (
                          <>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(item.deadline), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.participants || 0} participants
                    </div>
                  </>
                )}
              </div>
            </Link>
            {index < Math.min(content.items.length, 2) - 1 && (
              <Separator className="border-border/60" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

