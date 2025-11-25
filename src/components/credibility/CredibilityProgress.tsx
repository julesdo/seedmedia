"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface CredibilityProgressProps {
  score: number;
  className?: string;
  showLabel?: boolean;
}

const getScoreLevel = (score: number) => {
  if (score >= 81) return { label: "Maître", color: "text-purple-600", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" };
  if (score >= 51) return { label: "Expert", color: "text-blue-600", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" };
  if (score >= 21) return { label: "Contributeur", color: "text-green-600", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" };
  return { label: "Débutant", color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-border" };
};

export function CredibilityProgress({ score, className, showLabel = true }: CredibilityProgressProps) {
  const level = getScoreLevel(score);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SolarIcon icon="star-bold" className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Score de crédibilité</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      <Progress value={score} className="h-2" />

      {showLabel && (
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn("text-xs", level.bgColor, level.color, level.borderColor)}
          >
            {level.label}
          </Badge>
          {score < 100 && (
            <span className="text-xs text-muted-foreground">
              {score < 21 ? `${21 - score} points` : score < 51 ? `${51 - score} points` : score < 81 ? `${81 - score} points` : `${100 - score} points`} jusqu'au prochain niveau
            </span>
          )}
        </div>
      )}
    </div>
  );
}

