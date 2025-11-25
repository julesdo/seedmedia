"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface StatItem {
  icon: string;
  label: string;
  value: number;
}

export function PlatformStats() {
  const stats = useQuery(api.stats.getPlatformStats);

  if (!stats) {
    return (
      <div className="border-b border-border pb-8">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const statItems: StatItem[] = [
    {
      icon: "document-text-bold",
      label: "Articles",
      value: stats.articlesCount,
    },
    {
      icon: "hand-stars-bold",
      label: "Votes",
      value: stats.votesCount,
    },
    {
      icon: "users-group-two-rounded-bold",
      label: "Contributeurs",
      value: stats.activeUsersCount,
    },
    {
      icon: "chat-round-call-bold",
      label: "Débats",
      value: stats.openDebatesCount,
    },
  ];

  return (
    <div className="border-b border-border pb-8">
      <div className="space-y-0">
        {statItems.map((item, index) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <SolarIcon
                  icon={item.icon as any}
                  className="h-5 w-5 text-muted-foreground shrink-0"
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="text-lg font-bold shrink-0 ml-4">
                {item.value.toLocaleString()}
              </div>
            </div>
            {index < statItems.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  );
}

