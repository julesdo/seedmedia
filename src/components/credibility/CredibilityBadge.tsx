"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import {
  Tooltip,
  TooltipContent as TooltipContentBase,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface CredibilityBadgeProps {
  userId?: string;
  score?: number;
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
}

const getScoreLevel = (score: number) => {
  if (score >= 81) return { label: "Maître", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10 dark:bg-purple-500/20", borderColor: "border-purple-500/30" };
  if (score >= 51) return { label: "Expert", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10 dark:bg-blue-500/20", borderColor: "border-blue-500/30" };
  if (score >= 21) return { label: "Contributeur", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-500/10 dark:bg-green-500/20", borderColor: "border-green-500/30" };
  return { label: "Débutant", color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-border" };
};

export function CredibilityBadge({ userId, score: scoreProp, compact = false, showLabel = true, className }: CredibilityBadgeProps) {
  const user = useQuery(api.auth.getCurrentUser);
  const currentUserId = userId || user?._id;
  
  // Utiliser le score passé en prop ou celui de l'utilisateur
  const score = scoreProp ?? (user?.credibilityScore || 0);

  if (!currentUserId && !scoreProp) {
    return null;
  }

  const level = getScoreLevel(score);

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold transition-colors",
        "hover:opacity-80",
        level.bgColor,
        level.color,
        level.borderColor,
        compact && "px-1.5 py-0.5 gap-1",
        className
      )}
    >
      <SolarIcon 
        icon="star-bold" 
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          compact && "h-2.5 w-2.5"
        )} 
      />
      <span className={cn(
        "font-bold",
        compact && "text-[10px]"
      )}>
        {score}
      </span>
      {showLabel && !compact && (
        <span className="text-[10px] opacity-60 font-normal">/100</span>
      )}
    </Badge>
  );

  const tooltipContent = (
    <div className="space-y-3 p-1">
      {/* Header avec icône et score */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
          level.bgColor,
          "border",
          level.borderColor
        )}>
          <SolarIcon icon="star-bold" className={cn("h-full w-full", level.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gradient-light">{score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Score de crédibilité</p>
        </div>
      </div>

      {/* Niveau avec badge */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Niveau :</span>
          <Badge variant="default" className="text-xs">
            {level.label}
          </Badge>
        </div>
      </div>

    </div>
  );

  // TooltipContent personnalisé sans flèche
  const TooltipContent = ({ children, ...props }: React.ComponentProps<typeof TooltipContentBase>) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={8}
        className={cn(
          "max-w-[280px] p-0",
          "bg-background/95 backdrop-blur-xl border border-border/50",
          "shadow-xl shadow-black/10 dark:shadow-black/30",
          "rounded-xl overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "z-50"
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {currentUserId ? (
              <Link href="/studio/credibilite" className="inline-block">
                {badgeContent}
              </Link>
            ) : (
              badgeContent
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="p-4">
              {tooltipContent}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {currentUserId ? (
            <Link href="/studio/credibilite" className="inline-block">
              {badgeContent}
            </Link>
          ) : (
            badgeContent
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="p-4">
            {tooltipContent}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

