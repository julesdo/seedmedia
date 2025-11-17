"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";

interface OrganizationStatsProps {
  stats: {
    followersCount: number;
    articlesCount: number;
    projectsCount: number;
    actionsCount: number;
    membersCount: number;
  };
}

export function OrganizationStats({ stats }: OrganizationStatsProps) {
  const statItems = [
    {
      label: "Abonnés",
      value: stats.followersCount,
      icon: "users-group-rounded-bold" as const,
    },
    {
      label: "Articles",
      value: stats.articlesCount,
      icon: "document-text-bold" as const,
    },
    {
      label: "Projets",
      value: stats.projectsCount,
      icon: "folder-with-files-bold" as const,
    },
    {
      label: "Actions",
      value: stats.actionsCount,
      icon: "handshake-bold" as const,
    },
    {
      label: "Membres",
      value: stats.membersCount,
      icon: "users-group-two-rounded-bold" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statItems.map((item) => (
        <Card key={item.label} className="border-border/50">
          <CardContent className="p-4 text-center space-y-1">
            <div className="flex items-center justify-center text-muted-foreground opacity-70">
              <SolarIcon icon={item.icon} className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gradient-light">{item.value}</div>
            <div className="text-xs text-muted-foreground opacity-70">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

