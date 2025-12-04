"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface BreakdownItem {
  points: number;
  maxPoints: number;
  count?: number;
  label: string;
  role?: string;
  domainsCount?: number;
  expertVerifications?: number;
  totalVerifications?: number;
}

interface CredibilityBreakdownProps {
  breakdown: {
    publications: BreakdownItem;
    sources: BreakdownItem;
    votes: BreakdownItem;
    corrections: BreakdownItem;
    expertise: BreakdownItem;
    behavior: BreakdownItem;
  };
  className?: string;
}

const getFactorIcon = (key: string) => {
  switch (key) {
    case "publications":
      return "document-text-bold";
    case "sources":
      return "link-bold";
    case "votes":
      return "like-bold";
    case "corrections":
      return "verified-check-bold";
    case "expertise":
      return "user-id-bold";
    case "behavior":
      return "shield-check-bold";
    default:
      return "star-bold";
  }
};

const getFactorColor = (key: string) => {
  switch (key) {
    case "publications":
      return "text-blue-600";
    case "sources":
      return "text-green-600";
    case "votes":
      return "text-purple-600";
    case "corrections":
      return "text-orange-600";
    case "expertise":
      return "text-pink-600";
    case "behavior":
      return "text-cyan-600";
    default:
      return "text-muted-foreground";
  }
};

export function CredibilityBreakdown({ breakdown, className }: CredibilityBreakdownProps) {
  const factors = [
    { key: "publications", data: breakdown.publications },
    { key: "sources", data: breakdown.sources },
    { key: "votes", data: breakdown.votes },
    { key: "corrections", data: breakdown.corrections },
    { key: "expertise", data: breakdown.expertise },
    { key: "behavior", data: breakdown.behavior },
  ];

  return (
    <Card className={cn("border border-border/60 bg-card", className)}>
      <CardHeader>
        <CardTitle>Décomposition du score</CardTitle>
        <CardDescription>
          Détail des facteurs qui contribuent à votre score de crédibilité
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {factors.map(({ key, data }) => {
          const percentage = data.maxPoints > 0 ? (data.points / data.maxPoints) * 100 : 0;
          const icon = getFactorIcon(key);
          const color = getFactorColor(key);

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SolarIcon icon={icon as any} className={cn("h-4 w-4", color)} />
                  <span className="text-sm font-medium">{data.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{data.points.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ {data.maxPoints}</span>
                </div>
              </div>

              <Progress value={percentage} className="h-1.5" />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {data.count !== undefined && (
                  <span>{data.count} {key === "publications" ? "articles" : key === "sources" ? "sources" : key === "votes" ? "votes" : key === "corrections" ? "corrections" : ""}</span>
                )}
                {data.role && (
                  <span>Rôle: {data.role === "editeur" ? "Éditeur" : data.role === "contributeur" ? "Contributeur" : "Explorateur"}</span>
                )}
                {data.domainsCount !== undefined && data.domainsCount > 0 && (
                  <span>{data.domainsCount} domaine{data.domainsCount > 1 ? "s" : ""} d'expertise</span>
                )}
                {data.expertVerifications !== undefined && data.totalVerifications !== undefined && (
                  <span>{data.expertVerifications} expertes, {data.totalVerifications} total</span>
                )}
                <span className="ml-auto">{percentage.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

