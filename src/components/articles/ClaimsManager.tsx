"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface Claim {
  _id?: Id<"articleClaims">;
  claimText: string;
  sources: Source[];
  verificationStatus?: "unverified" | "verified" | "disputed" | "false";
  verificationScore?: number;
}

interface Source {
  sourceType:
    | "scientific_paper"
    | "expert_statement"
    | "official_data"
    | "news_article"
    | "website"
    | "other";
  title: string;
  url?: string;
  author?: string;
  publicationDate?: number;
  reliabilityScore: number;
}

interface ClaimsManagerProps {
  articleId: Id<"articles">;
  initialClaims?: Claim[];
}

const SOURCE_TYPES = [
  { value: "scientific_paper", label: "Article scientifique" },
  { value: "expert_statement", label: "Déclaration d'expert" },
  { value: "official_data", label: "Données officielles" },
  { value: "news_article", label: "Article de presse" },
  { value: "website", label: "Site web" },
  { value: "other", label: "Autre" },
] as const;

export function ClaimsManager({
  articleId,
  initialClaims = [],
}: ClaimsManagerProps) {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [editingClaimIndex, setEditingClaimIndex] = useState<number | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Charger les claims depuis l'API
  const articleClaims = useQuery(api.articles.getArticleClaims, {
    articleId,
  });

  const addClaim = useMutation(api.articles.addClaim);
  const addSourceToClaim = useMutation(api.articles.addSourceToClaim);

  // Synchroniser les claims chargés
  useEffect(() => {
    if (articleClaims) {
      const formattedClaims: Claim[] = articleClaims.map((claim) => ({
        _id: claim._id,
        claimText: claim.claimText,
        sources: claim.sources || [],
        verificationStatus: claim.verificationStatus,
        verificationScore: claim.verificationScore,
      }));
      setClaims(formattedClaims);
    } else if (initialClaims.length > 0) {
      setClaims(initialClaims);
    }
  }, [articleClaims, initialClaims]);

  const handleAddClaim = () => {
    setClaims([
      ...claims,
      {
        claimText: "",
        sources: [],
        verificationStatus: "unverified",
        verificationScore: 0,
      },
    ]);
    setEditingClaimIndex(claims.length);
    setIsDialogOpen(true);
  };

  const handleSaveClaim = async (index: number, claim: Claim) => {
    if (!claim.claimText.trim()) {
      toast.error("Le texte de l'affirmation est requis");
      return;
    }

    try {
      // Si c'est un nouveau claim, l'ajouter via l'API
      if (!claim._id) {
        const result = await addClaim({
          articleId,
          claimText: claim.claimText.trim(),
        });

        // Mettre à jour avec l'ID
        const updatedClaims = [...claims];
        updatedClaims[index] = {
          ...claim,
          _id: result.claimId,
        };
        setClaims(updatedClaims);
      } else {
        // Mettre à jour localement
        const updatedClaims = [...claims];
        updatedClaims[index] = claim;
        setClaims(updatedClaims);
      }

      // Ajouter les sources
      if (claim._id) {
        for (const source of claim.sources) {
          await addSourceToClaim({
            claimId: claim._id,
            sourceType: source.sourceType,
            title: source.title,
            url: source.url,
            author: source.author,
            publicationDate: source.publicationDate,
            reliabilityScore: source.reliabilityScore,
          });
        }
      }

      toast.success("Affirmation sauvegardée");
      setEditingClaimIndex(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Erreur sauvegarde claim:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    }
  };

  const handleRemoveClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Vérifié
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Contesté
          </Badge>
        );
      case "false":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Faux
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Non vérifié
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Affirmations et sources</CardTitle>
            <CardDescription>
              Ajoutez des affirmations vérifiables avec leurs sources pour
              améliorer la fiabilité de votre article
            </CardDescription>
          </div>
          <Button type="button" onClick={handleAddClaim} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une affirmation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {claims.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune affirmation ajoutée</p>
            <p className="text-sm mt-2">
              Les affirmations avec sources améliorent le score de qualité de
              votre article
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{claim.claimText}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(claim.verificationStatus)}
                        {claim.verificationScore !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Score: {claim.verificationScore}/100
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingClaimIndex(index);
                          setIsDialogOpen(true);
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClaim(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {claim.sources.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm">Sources:</Label>
                      {claim.sources.map((source, sourceIndex) => (
                        <div
                          key={sourceIndex}
                          className="flex items-center gap-2 p-2 bg-muted rounded-md"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{source.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {SOURCE_TYPES.find(
                                (t) => t.value === source.sourceType
                              )?.label}
                              {source.reliabilityScore > 0 && (
                                <> • Fiabilité: {source.reliabilityScore}/100</>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog pour éditer/ajouter un claim */}
        {editingClaimIndex !== null && (
          <ClaimDialog
            claim={claims[editingClaimIndex]}
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingClaimIndex(null);
            }}
            onSave={(claim) => handleSaveClaim(editingClaimIndex, claim)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ClaimDialog({
  claim,
  isOpen,
  onClose,
  onSave,
}: {
  claim: Claim;
  isOpen: boolean;
  onClose: () => void;
  onSave: (claim: Claim) => void;
}) {
  const [claimText, setClaimText] = useState(claim.claimText);
  const [sources, setSources] = useState<Source[]>(claim.sources || []);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [newSource, setNewSource] = useState<Source>({
    sourceType: "website",
    title: "",
    url: "",
    reliabilityScore: 50,
  });

  const handleAddSource = () => {
    if (!newSource.title.trim()) {
      toast.error("Le titre de la source est requis");
      return;
    }

    setSources([...sources, newSource]);
    setNewSource({
      sourceType: "website",
      title: "",
      url: "",
      reliabilityScore: 50,
    });
    setShowSourceForm(false);
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      ...claim,
      claimText,
      sources,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {claim._id ? "Modifier l'affirmation" : "Nouvelle affirmation"}
          </DialogTitle>
          <DialogDescription>
            Ajoutez une affirmation vérifiable avec ses sources pour améliorer
            la fiabilité de votre article
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Texte de l'affirmation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="Ex: Les énergies renouvelables représentent 30% de la production d'électricité en Nouvelle-Aquitaine"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sources</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSourceForm(!showSourceForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une source
              </Button>
            </div>

            {showSourceForm && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type de source</Label>
                      <Select
                        value={newSource.sourceType}
                        onValueChange={(value: any) =>
                          setNewSource({ ...newSource, sourceType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Score de fiabilité (0-100)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newSource.reliabilityScore}
                        onChange={(e) =>
                          setNewSource({
                            ...newSource,
                            reliabilityScore: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Titre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newSource.title}
                      onChange={(e) =>
                        setNewSource({ ...newSource, title: e.target.value })
                      }
                      placeholder="Titre de la source"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      type="url"
                      value={newSource.url}
                      onChange={(e) =>
                        setNewSource({ ...newSource, url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Auteur</Label>
                    <Input
                      value={newSource.author}
                      onChange={(e) =>
                        setNewSource({ ...newSource, author: e.target.value })
                      }
                      placeholder="Auteur de la source"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddSource}
                      className="flex-1"
                    >
                      Ajouter
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSourceForm(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {sources.length > 0 && (
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-muted rounded-md"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{source.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {SOURCE_TYPES.find(
                          (t) => t.value === source.sourceType
                        )?.label}
                        {source.url && (
                          <>
                            {" • "}
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Lien
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSource(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

