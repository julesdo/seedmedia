"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  _id: string;
  previousScore: number;
  newScore: number;
  pointsGained: number;
  actionType: "article_published" | "source_added" | "vote_received" | "correction_approved" | "expertise_granted" | "verification_done" | "recalculation";
  actionDetails?: {
    articleId?: string;
    sourceId?: string;
    voteId?: string;
    correctionId?: string;
    verificationId?: string;
    reason?: string;
  };
  createdAt: number;
}

interface CredibilityHistoryProps {
  history: HistoryEntry[];
}

const getActionLabel = (actionType: HistoryEntry["actionType"]) => {
  switch (actionType) {
    case "article_published":
      return "Article publié";
    case "source_added":
      return "Source ajoutée";
    case "vote_received":
      return "Vote reçu";
    case "correction_approved":
      return "Correction approuvée";
    case "expertise_granted":
      return "Expertise accordée";
    case "verification_done":
      return "Vérification effectuée";
    case "recalculation":
      return "Recalcul automatique";
    default:
      return "Action";
  }
};

const getActionIcon = (actionType: HistoryEntry["actionType"]) => {
  switch (actionType) {
    case "article_published":
      return "document-text-bold";
    case "source_added":
      return "link-bold";
    case "vote_received":
      return "like-bold";
    case "correction_approved":
      return "verified-check-bold";
    case "expertise_granted":
      return "user-id-bold";
    case "verification_done":
      return "shield-check-bold";
    case "recalculation":
      return "refresh-bold";
    default:
      return "star-bold";
  }
};

export function CredibilityHistory({ history }: CredibilityHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>
            Historique de vos gains de crédibilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <SolarIcon icon="history-bold" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Aucun historique pour le moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique</CardTitle>
        <CardDescription>
          Historique de vos gains de crédibilité ({history.length} entrée{history.length > 1 ? "s" : ""})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((entry) => {
            const isPositive = entry.pointsGained > 0;
            const icon = getActionIcon(entry.actionType);
            const label = getActionLabel(entry.actionType);

            return (
              <div
                key={entry._id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  isPositive ? "bg-green-500/10" : "bg-muted"
                )}>
                  <SolarIcon
                    icon={icon as any}
                    className={cn(
                      "h-4 w-4",
                      isPositive ? "text-green-600" : "text-muted-foreground"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{label}</span>
                    <Badge
                      variant={isPositive ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        isPositive && "bg-green-500/10 text-green-600 border-green-500/30"
                      )}
                    >
                      {isPositive ? "+" : ""}{entry.pointsGained.toFixed(1)} points
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {entry.previousScore} → {entry.newScore}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

