"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "next-view-transitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SolarIcon } from "@/components/icons/SolarIcon";

export function HomeDebats() {
  const openDebates = useQuery(api.debates.getOpenDebates, { 
    limit: 3,
    sortBy: "recent"
  });

  return (
    <div className="border-b border-border/60 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">Débats en cours</h3>
        <Link 
          href="/debats" 
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Voir tout
        </Link>
      </div>
      {openDebates === undefined ? (
        <Skeleton className="h-16 w-full" />
      ) : openDebates && openDebates.length > 0 ? (
        <div className="space-y-0">
          {openDebates.slice(0, 2).map((debat, index) => (
            <div key={debat._id}>
              <Link
                href={`/debats/${debat.slug}`}
                className="block py-3 group"
              >
                <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                  {debat.question}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <SolarIcon icon="chat-round-bold" className="h-3 w-3" />
                    {(debat.argumentsForCount || 0) + (debat.argumentsAgainstCount || 0)} arguments
                  </span>
                </div>
              </Link>
              {index < Math.min(openDebates.length, 2) - 1 && <Separator className="border-border/60" />}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aucun débat en cours
        </p>
      )}
    </div>
  );
}
