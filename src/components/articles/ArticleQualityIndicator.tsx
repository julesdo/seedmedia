"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { ArticleSection } from "./ArticleSectionEditor";
import { cn } from "@/lib/utils";

interface ArticleQualityIndicatorProps {
  sections: ArticleSection[];
  claimsCount: number;
  articleType: string;
  wordCount: number;
}

export function ArticleQualityIndicator({
  sections,
  claimsCount,
  articleType,
  wordCount,
}: ArticleQualityIndicatorProps) {
  // Calculer le score de qualité global
  const calculateQualityScore = (): number => {
    let score = 0;
    let maxScore = 0;

    // Score basé sur la longueur (0-30 points)
    maxScore += 30;
    if (wordCount >= 2000) {
      score += 30;
    } else if (wordCount >= 1000) {
      score += 25;
    } else if (wordCount >= 500) {
      score += 15;
    } else if (wordCount >= 200) {
      score += 10;
    }

    // Score basé sur les sections (0-20 points)
    maxScore += 20;
    if (sections.length >= 5) {
      score += 20;
    } else if (sections.length >= 3) {
      score += 15;
    } else if (sections.length >= 2) {
      score += 10;
    } else {
      score += 5;
    }

    // Score basé sur les claims (0-30 points)
    maxScore += 30;
    const sectionsWithClaims = sections.filter((s) => s.hasClaims).length;
    if (sectionsWithClaims === sections.length && sections.length > 0) {
      score += 30;
    } else if (sectionsWithClaims >= sections.length * 0.5) {
      score += 20;
    } else if (sectionsWithClaims > 0) {
      score += 10;
    }

    // Bonus selon le type d'article (0-20 points)
    maxScore += 20;
    const typeBonus = {
      scientific: 20,
      expert: 15,
      tutorial: 12,
      news: 8,
      opinion: 5,
      other: 3,
    }[articleType as keyof typeof typeBonus] || 0;
    score += typeBonus;

    return Math.round((score / maxScore) * 100);
  };

  const qualityScore = calculateQualityScore();
  const getQualityLevel = () => {
    if (qualityScore >= 80) return { label: "Excellent", color: "green" };
    if (qualityScore >= 60) return { label: "Bon", color: "blue" };
    if (qualityScore >= 40) return { label: "Moyen", color: "yellow" };
    return { label: "À améliorer", color: "red" };
  };

  const quality = getQualityLevel();

  const recommendations: string[] = [];
  if (wordCount < 1000) {
    recommendations.push("Augmentez la longueur de votre article (minimum 1000 mots recommandé)");
  }
  if (sections.length < 3) {
    recommendations.push("Ajoutez plus de sections pour mieux structurer votre contenu");
  }
  if (claimsCount === 0) {
    recommendations.push("Ajoutez des affirmations vérifiables avec sources pour améliorer la crédibilité");
  }
  const sectionsWithoutClaims = sections.filter((s) => !s.hasClaims && s.wordCount > 200);
  if (sectionsWithoutClaims.length > 0) {
    recommendations.push(`${sectionsWithoutClaims.length} section(s) sans affirmations vérifiables`);
  }

  return (
    <Card className="border bg-card">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Score de qualité */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SolarIcon icon="chart-bold" className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Score de qualité</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold",
                  quality.color === "green" && "bg-green-500/10 text-green-600 border-green-500/30",
                  quality.color === "blue" && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                  quality.color === "yellow" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                  quality.color === "red" && "bg-red-500/10 text-red-600 border-red-500/30"
                )}
              >
                {quality.label}
              </Badge>
            </div>
            <Progress value={qualityScore} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {qualityScore}/100
            </p>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/20">
            <div className="text-center">
              <div className="text-lg font-bold text-gradient-light">{wordCount}</div>
              <div className="text-xs text-muted-foreground">Mots</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gradient-light">{sections.length}</div>
              <div className="text-xs text-muted-foreground">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gradient-light">{claimsCount}</div>
              <div className="text-xs text-muted-foreground">Affirmations</div>
            </div>
          </div>

          {/* Recommandations */}
          {recommendations.length > 0 && (
            <div className="pt-2 border-t border-border/20 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-semibold">Recommandations</span>
              </div>
              <ul className="space-y-1.5">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Message positif si bon score */}
          {qualityScore >= 80 && (
            <div className="pt-2 border-t border-border/20">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">
                  Excellent travail ! Votre article a une bonne structure et des affirmations vérifiables.
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

