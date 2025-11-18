"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WritingAssistantProps {
  content: string;
  wordCount: number;
  claimsCount: number;
  articleType: string;
  onSuggestionClick?: (suggestion: string) => void;
}

interface Suggestion {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  action?: string;
}

export function WritingAssistant({
  content,
  wordCount,
  claimsCount,
  articleType,
  onSuggestionClick,
}: WritingAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const suggestions: Suggestion[] = [];

  // Vérifier la longueur minimale
  if (wordCount < 500) {
    suggestions.push({
      type: "warning",
      title: "Article court",
      description: `Votre article fait ${wordCount} mots. Pour un contenu scientifique, visez au moins 1000 mots.`,
      action: "Ajouter plus de détails",
    });
  }

  // Vérifier les affirmations
  if (claimsCount === 0 && wordCount > 300) {
    suggestions.push({
      type: "warning",
      title: "Aucune affirmation vérifiable",
      description:
        "Ajoutez des affirmations avec sources pour améliorer la crédibilité de votre article.",
      action: "Ajouter des affirmations",
    });
  }

  // Vérifier le type d'article
  if (articleType === "opinion" && claimsCount < 2) {
    suggestions.push({
      type: "info",
      title: "Opinion à justifier",
      description:
        "Les articles d'opinion nécessitent des justifications solides. Ajoutez des sources pour étayer vos arguments.",
      action: "Justifier mon opinion",
    });
  }

  // Suggestions positives
  if (wordCount >= 1000 && claimsCount >= 3) {
    suggestions.push({
      type: "success",
      title: "Excellent travail",
      description:
        "Votre article a une bonne longueur et des affirmations vérifiables. Continuez !",
    });
  }

  // Suggestions générales
  suggestions.push({
    type: "info",
    title: "Structure recommandée",
    description:
      "Introduction → Contexte → Méthodologie → Résultats → Discussion → Conclusion",
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-primary" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "success":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      default:
        return "bg-primary/10 text-primary border-primary/30";
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SolarIcon icon="magic-stick-bold" className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Assistant de rédaction</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8"
          >
            <SolarIcon
              icon={isExpanded ? "alt-arrow-up-bold" : "alt-arrow-down-bold"}
              className="h-4 w-4"
            />
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border bg-muted/40",
                suggestion.type === "warning" && "border-yellow-200",
                suggestion.type === "success" && "border-emerald-200",
                suggestion.type === "info" && "border-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                {getIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{suggestion.title}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getBadgeColor(suggestion.type))}
                    >
                      {suggestion.type === "warning" && "Important"}
                      {suggestion.type === "success" && "Excellent"}
                      {suggestion.type === "info" && "Conseil"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {suggestion.description}
                  </p>
                  {suggestion.action && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() =>
                        onSuggestionClick?.(suggestion.action || "")
                      }
                    >
                      {suggestion.action}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

