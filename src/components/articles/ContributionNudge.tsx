"use client";

import * as React from "react";
import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";
import { CredibilityGainBadge } from "@/components/credibility/CredibilityGainBadge";
import { CredibilityIndicator } from "@/components/credibility/CredibilityIndicator";
import { useCredibilityPoints } from "@/hooks/useCredibilityPoints";

interface ContributionNudgeProps {
  articleId: Id<"articles">;
  articleTitle: string;
  sourcesCount?: number;
  counterArgumentsCount?: number;
}

const CORRECTION_TYPES = [
  { value: "source", label: "Proposer une source" },
  { value: "contre_argument", label: "Ajouter un contre-argument" },
  { value: "fact_check", label: "Signaler une erreur factuelle" },
  { value: "other", label: "Autre correction" },
] as const;

export function ContributionNudge({
  articleId,
  articleTitle,
  sourcesCount = 0,
  counterArgumentsCount = 0,
}: ContributionNudgeProps) {
  const { isAuthenticated } = useConvexAuth();
  const proposeCorrection = useMutation(api.articleCorrections.proposeCorrection);
  const credibilityPoints = useCredibilityPoints();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [correctionType, setCorrectionType] = useState<"source" | "contre_argument" | "fact_check" | "other">("source");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Déterminer quelle action suggérer (principe de Scarcity et FOMO)
  const suggestedAction = React.useMemo(() => {
    if (sourcesCount < 2) {
      return {
        type: "source" as const,
        icon: "link-bold" as const,
        title: "Enrichir l'article",
        description: `${2 - sourcesCount} source(s) manquante(s)`,
        cta: "Ajouter une source",
        color: "text-blue-600 dark:text-blue-400",
      };
    }
    if (counterArgumentsCount < 1) {
      return {
        type: "contre_argument" as const,
        icon: "question-circle-bold" as const,
        title: "Équilibrer le débat",
        description: "Aucun contre-argument pour le moment",
        cta: "Ajouter un contre-argument",
        color: "text-orange-600 dark:text-orange-400",
      };
    }
    return {
      type: "fact_check" as const,
      icon: "verified-check-bold" as const,
      title: "Améliorer l'article",
      description: "Proposez une correction ou une amélioration",
      cta: "Proposer une amélioration",
      color: "text-green-600 dark:text-green-400",
    };
  }, [sourcesCount, counterArgumentsCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await proposeCorrection({
        articleId,
        correctionType,
        title: title.trim(),
        description: description.trim(),
        content: content.trim() || undefined,
      });

      toast.success("Votre contribution a été soumise ! Elle sera examinée par les éditeurs.");
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      setContent("");
      setCorrectionType("source");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="border-l-2 border-primary/40 pl-3 py-2.5 bg-muted/20 rounded-r space-y-2">
        <div className="flex items-center gap-2">
          <SolarIcon icon={suggestedAction.icon} className={`h-3.5 w-3.5 ${suggestedAction.color}`} />
          <h3 className="font-semibold text-sm">{suggestedAction.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{suggestedAction.description}</p>
        <Button asChild variant="default" size="sm" className="h-7 text-xs shadow-none">
          <Link href="/signin">
            <SolarIcon icon="login-3-bold" className="h-3 w-3 mr-1.5" />
            Se connecter
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-primary/40 pl-3 py-2.5 bg-muted/20 rounded-r space-y-2">
      <div className="flex items-center gap-2">
        <SolarIcon icon={suggestedAction.icon} className={`h-3.5 w-3.5 ${suggestedAction.color}`} />
        <h3 className="font-semibold text-sm">{suggestedAction.title}</h3>
        <Badge variant="secondary" className="text-[11px] px-1.5 py-0 ml-auto">
          <SolarIcon icon="star-bold" className="h-3 w-3 mr-0.5" />
          +Crédibilité
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{suggestedAction.description}</p>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="h-7 text-xs shadow-none">
            <SolarIcon icon="add-circle-bold" className="h-3 w-3 mr-1.5" />
            {suggestedAction.cta}
          </Button>
        </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Proposer une contribution</DialogTitle>
              <DialogDescription>
                Votre contribution sera examinée par les éditeurs.
              </DialogDescription>
              <CredibilityIndicator 
                points={credibilityPoints.correctionApproved} 
                action="Les contributions approuvées vous rapportent" 
                variant="default"
                className="mt-2"
              />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="correctionType">Type de contribution</Label>
                <Select
                  value={correctionType}
                  onValueChange={(value: any) => {
                    setCorrectionType(value);
                    // Pré-remplir le titre selon le type
                    if (value === "source") {
                      setTitle("Nouvelle source pour l'article");
                    } else if (value === "contre_argument") {
                      setTitle("Contre-argument");
                    } else if (value === "fact_check") {
                      setTitle("Correction factuelle");
                    } else {
                      setTitle("");
                    }
                  }}
                >
                  <SelectTrigger id="correctionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CORRECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de votre contribution"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    correctionType === "source"
                      ? "Décrivez la source et son lien avec l'article..."
                      : correctionType === "contre_argument"
                      ? "Formulez votre contre-argument..."
                      : "Décrivez la correction ou l'amélioration proposée..."
                  }
                  rows={4}
                  required
                />
              </div>

              {correctionType === "source" && (
                <div className="space-y-2">
                  <Label htmlFor="content">URL ou référence de la source</Label>
                  <Input
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              )}

              {correctionType !== "source" && (
                <div className="space-y-2">
                  <Label htmlFor="content">Contenu détaillé (optionnel)</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Détails supplémentaires..."
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                      Soumettre
                      <CredibilityGainBadge points={credibilityPoints.correctionApproved} size="sm" className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}

