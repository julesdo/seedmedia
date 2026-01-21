"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityTabProps {
  decisionId: Id<"decisions">;
}

export function ActivityTab({ decisionId }: ActivityTabProps) {
  const transactions = useQuery(api.trading.getTradingHistory, { decisionId, limit: 50 });

  if (transactions === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aucune activité pour le moment
      </div>
    );
  }

  // Trier par timestamp décroissant (plus récent en premier)
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-2">
      {sorted.map((transaction) => (
        <div
          key={transaction._id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/40 hover:bg-background/60 transition-colors"
        >
          <div
            className={cn(
              "size-8 rounded-full flex items-center justify-center flex-shrink-0",
              transaction.type === "buy"
                ? transaction.position === "yes"
                  ? YES_COLORS.bg.medium
                  : NO_COLORS.bg.medium
                : "bg-muted"
            )}
          >
            <SolarIcon
              icon={transaction.type === "buy" ? "arrow-down-bold" : "arrow-up-bold"}
              className={cn(
                "size-4",
                transaction.type === "buy"
                  ? transaction.position === "yes"
                    ? YES_COLORS.text.light
                    : NO_COLORS.text.light
                  : "text-muted-foreground"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Avatar className="size-6 flex-shrink-0">
                <AvatarImage src={transaction.user?.image} alt={transaction.user?.name || ""} />
                <AvatarFallback className="text-[10px]">
                  {transaction.user?.name?.[0]?.toUpperCase() || transaction.user?.email?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground">
                {transaction.user?.name || transaction.user?.email || "Utilisateur"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {transaction.type === "buy" ? "Achat" : "Vente"}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded",
                  transaction.position === "yes"
                    ? cn(YES_COLORS.bg.medium, YES_COLORS.text.light)
                    : cn(NO_COLORS.bg.medium, NO_COLORS.text.light)
                )}
              >
                {transaction.position === "yes" ? "OUI" : "NON"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <SeedDisplay
              amount={transaction.type === "buy" ? transaction.cost : transaction.netAmount || transaction.cost}
              variant="default"
              className="text-sm font-bold"
              iconSize="size-3"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

