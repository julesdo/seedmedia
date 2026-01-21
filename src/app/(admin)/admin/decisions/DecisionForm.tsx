"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DecisionFormProps {
  decisionId?: Id<"decisions">;
  initialData?: any;
}

/**
 * Fonction pour générer un slug à partir d'un titre
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, "") // Supprimer les tirets en début/fin
    .substring(0, 100); // Limiter la longueur
}

/**
 * Formulaire de création/modification de décision
 */
export function DecisionForm({ decisionId, initialData }: DecisionFormProps) {
  const router = useRouter();
  const isEditing = !!decisionId;
  const createDecision = useMutation(api.admin.createDecision);
  const updateDecision = useMutation(api.admin.updateDecision);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    slug: initialData?.slug || "",
    decider: initialData?.decider || "",
    deciderType: (initialData?.deciderType || "country") as
      | "country"
      | "institution"
      | "leader"
      | "organization"
      | "natural"
      | "economic",
    date: initialData?.date
      ? new Date(initialData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    type: (initialData?.type || "other") as
      | "law"
      | "sanction"
      | "tax"
      | "agreement"
      | "policy"
      | "regulation"
      | "crisis"
      | "disaster"
      | "conflict"
      | "discovery"
      | "election"
      | "economic_event"
      | "other",
    officialText: initialData?.officialText || "",
    sourceUrl: initialData?.sourceUrl || "",
    sourceName: initialData?.sourceName || "",
    impactedDomains: initialData?.impactedDomains?.join(", ") || "",
    question: initialData?.question || "",
    answer1: initialData?.answer1 || "",
    targetPrice: initialData?.targetPrice?.toString() || "50",
    depthFactor: initialData?.depthFactor?.toString() || "5000",
    imageUrl: initialData?.imageUrl || "",
    imageSource: initialData?.imageSource || "",
    sentiment: (initialData?.sentiment || "neutral") as "positive" | "negative" | "neutral",
    heat: initialData?.heat?.toString() || "50",
    emoji: initialData?.emoji || "📋",
    badgeColor: initialData?.badgeColor || "#246BFD",
    status: (initialData?.status || "announced") as "announced" | "tracking" | "resolved",
    specialEvent: (initialData?.specialEvent || "") as
      | "municipales_2026"
      | "presidentielles_2027"
      | "",
    specialEventRegion: initialData?.specialEventMetadata?.region || "",
    specialEventCity: initialData?.specialEventMetadata?.city || "",
    specialEventCategory: (initialData?.specialEventMetadata?.eventCategory || "") as
      | "blockbuster"
      | "tendance"
      | "insolite"
      | "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  // Auto-générer le slug à partir du titre
  useEffect(() => {
    if (autoGenerateSlug && !isEditing && formData.title) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.title),
      }));
    }
  }, [formData.title, autoGenerateSlug, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parser les domaines impactés
      const impactedDomains = formData.impactedDomains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      // Parser la date
      const date = new Date(formData.date).getTime();

      if (isEditing && decisionId) {
        // Mise à jour
        await updateDecision({
          decisionId,
          title: formData.title,
          description: formData.description,
          slug: formData.slug,
          decider: formData.decider,
          deciderType: formData.deciderType,
          date,
          type: formData.type,
          officialText: formData.officialText,
          sourceUrl: formData.sourceUrl,
          sourceName: formData.sourceName || undefined,
          impactedDomains,
          indicatorIds: [], // TODO: Ajouter un sélecteur d'indicateurs
          question: formData.question,
          answer1: formData.answer1,
          targetPrice: parseFloat(formData.targetPrice) || undefined,
          depthFactor: parseFloat(formData.depthFactor) || undefined,
          imageUrl: formData.imageUrl || undefined,
          imageSource: formData.imageSource || undefined,
          status: formData.status,
          sentiment: formData.sentiment,
          heat: parseInt(formData.heat) || 50,
          emoji: formData.emoji,
          badgeColor: formData.badgeColor,
          specialEvent:
            formData.specialEvent || undefined,
          specialEventMetadata:
            formData.specialEvent || formData.specialEventRegion || formData.specialEventCity
              ? {
                  region: formData.specialEventRegion || undefined,
                  city: formData.specialEventCity || undefined,
                  eventCategory: formData.specialEventCategory || undefined,
                }
              : undefined,
        });

        toast.success("Décision mise à jour avec succès");
        router.push("/admin/decisions");
      } else {
        // Création (contentHash généré automatiquement côté serveur)
        const result = await createDecision({
          title: formData.title,
          description: formData.description,
          slug: formData.slug,
          decider: formData.decider,
          deciderType: formData.deciderType,
          date,
          type: formData.type,
          officialText: formData.officialText,
          sourceUrl: formData.sourceUrl,
          sourceName: formData.sourceName || undefined,
          impactedDomains,
          indicatorIds: [], // TODO: Ajouter un sélecteur d'indicateurs
          question: formData.question,
          answer1: formData.answer1,
          targetPrice: parseFloat(formData.targetPrice) || undefined,
          depthFactor: parseFloat(formData.depthFactor) || undefined,
          imageUrl: formData.imageUrl || undefined,
          imageSource: formData.imageSource || undefined,
          sentiment: formData.sentiment,
          heat: parseInt(formData.heat) || 50,
          emoji: formData.emoji,
          badgeColor: formData.badgeColor,
          specialEvent:
            formData.specialEvent || undefined,
          specialEventMetadata:
            formData.specialEvent || formData.specialEventRegion || formData.specialEventCity
              ? {
                  region: formData.specialEventRegion || undefined,
                  city: formData.specialEventCity || undefined,
                  eventCategory: formData.specialEventCategory || undefined,
                }
              : undefined,
        });

        toast.success("Décision créée avec succès");
        router.push(`/admin/decisions/${result.decisionId}`);
      }
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Informations de base</TabsTrigger>
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="special">Événements spéciaux</TabsTrigger>
        </TabsList>

        {/* Informations de base */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>
                Titre, description et identifiants de la décision
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: La France adopte une nouvelle loi sur le climat"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description courte de l'événement"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">Slug *</Label>
                  {!isEditing && (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={autoGenerateSlug}
                        onChange={(e) => setAutoGenerateSlug(e.target.checked)}
                        className="size-4"
                      />
                      Auto-générer depuis le titre
                    </label>
                  )}
                </div>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData({ ...formData, slug: e.target.value });
                    setAutoGenerateSlug(false);
                  }}
                  placeholder="la-france-adopte-une-nouvelle-loi-sur-le-climat"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Identifiant unique de l'URL (minuscules, tirets uniquement)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Question de prédiction *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Ex: Est-ce que cette loi sera adoptée ?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer1">Scénario OUI *</Label>
                <Textarea
                  id="answer1"
                  value={formData.answer1}
                  onChange={(e) => setFormData({ ...formData, answer1: e.target.value })}
                  placeholder="Ce qui se passe si la prédiction est vraie"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officialText">Texte officiel *</Label>
                <Textarea
                  id="officialText"
                  value={formData.officialText}
                  onChange={(e) => setFormData({ ...formData, officialText: e.target.value })}
                  placeholder="Texte de la décision ou de l'événement"
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">URL source *</Label>
                  <Input
                    id="sourceUrl"
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceName">Nom de la source</Label>
                  <Input
                    id="sourceName"
                    value={formData.sourceName}
                    onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                    placeholder="Ex: Le Monde"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL de l'image</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageSource">Source de l'image</Label>
                  <Input
                    id="imageSource"
                    value={formData.imageSource}
                    onChange={(e) => setFormData({ ...formData, imageSource: e.target.value })}
                    placeholder="Ex: Unsplash, Pexels"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classification */}
        <TabsContent value="classification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
              <CardDescription>
                Type, décideur, domaines impactés et métadonnées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type d'événement *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as any })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="law">Loi</SelectItem>
                      <SelectItem value="sanction">Sanction</SelectItem>
                      <SelectItem value="tax">Taxe</SelectItem>
                      <SelectItem value="agreement">Accord</SelectItem>
                      <SelectItem value="policy">Politique</SelectItem>
                      <SelectItem value="regulation">Réglementation</SelectItem>
                      <SelectItem value="crisis">Crise</SelectItem>
                      <SelectItem value="disaster">Catastrophe</SelectItem>
                      <SelectItem value="conflict">Conflit</SelectItem>
                      <SelectItem value="discovery">Découverte</SelectItem>
                      <SelectItem value="election">Élection</SelectItem>
                      <SelectItem value="economic_event">Événement économique</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as any })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announced">Annoncée</SelectItem>
                      <SelectItem value="tracking">En suivi</SelectItem>
                      <SelectItem value="resolved">Résolue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="decider">Décideur *</Label>
                  <Input
                    id="decider"
                    value={formData.decider}
                    onChange={(e) => setFormData({ ...formData, decider: e.target.value })}
                    placeholder="Ex: France, UE, Joe Biden"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deciderType">Type de décideur *</Label>
                  <Select
                    value={formData.deciderType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, deciderType: value as any })
                    }
                  >
                    <SelectTrigger id="deciderType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="country">Pays</SelectItem>
                      <SelectItem value="institution">Institution</SelectItem>
                      <SelectItem value="leader">Dirigeant</SelectItem>
                      <SelectItem value="organization">Organisation</SelectItem>
                      <SelectItem value="natural">Naturel</SelectItem>
                      <SelectItem value="economic">Économique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date de la décision *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impactedDomains">Domaines impactés (séparés par des virgules)</Label>
                <Input
                  id="impactedDomains"
                  value={formData.impactedDomains}
                  onChange={(e) => setFormData({ ...formData, impactedDomains: e.target.value })}
                  placeholder="Ex: économie, énergie, diplomatie"
                />
                <p className="text-xs text-muted-foreground">
                  Liste les domaines impactés, séparés par des virgules
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sentiment">Sentiment</Label>
                  <Select
                    value={formData.sentiment}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sentiment: value as any })
                    }
                  >
                    <SelectTrigger id="sentiment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positif</SelectItem>
                      <SelectItem value="negative">Négatif</SelectItem>
                      <SelectItem value="neutral">Neutre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heat">Heat (0-100)</Label>
                  <Input
                    id="heat"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.heat}
                    onChange={(e) => setFormData({ ...formData, heat: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    placeholder="📋"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badgeColor">Couleur du badge (hex)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="badgeColor"
                    type="color"
                    value={formData.badgeColor}
                    onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.badgeColor}
                    onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                    placeholder="#246BFD"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading */}
        <TabsContent value="trading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de trading</CardTitle>
              <CardDescription>
                Paramètres IPO (Initial Political Offering) pour le marché prédictif
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Prix de départ (1-99 Seeds)</Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Prix initial de la probabilité (50 = probabilité moyenne)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depthFactor">Profondeur du marché (500-10000)</Label>
                  <Input
                    id="depthFactor"
                    type="number"
                    min="500"
                    max="10000"
                    value={formData.depthFactor}
                    onChange={(e) => setFormData({ ...formData, depthFactor: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    500 = volatile (meme coin), 10000 = stable (blue chip)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Événements spéciaux */}
        <TabsContent value="special" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Événements spéciaux</CardTitle>
              <CardDescription>
                Associer cette décision à un événement spécial (municipales, présidentielles, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialEvent">Événement spécial</Label>
                <Select
                  value={formData.specialEvent}
                  onValueChange={(value) =>
                    setFormData({ ...formData, specialEvent: value as any })
                  }
                >
                  <SelectTrigger id="specialEvent">
                    <SelectValue placeholder="Aucun événement spécial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    <SelectItem value="municipales_2026">Municipales 2026</SelectItem>
                    <SelectItem value="presidentielles_2027">Présidentielles 2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.specialEvent && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="specialEventRegion">Région</Label>
                      <Input
                        id="specialEventRegion"
                        value={formData.specialEventRegion}
                        onChange={(e) =>
                          setFormData({ ...formData, specialEventRegion: e.target.value })
                        }
                        placeholder="Ex: Île-de-France"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialEventCity">Ville</Label>
                      <Input
                        id="specialEventCity"
                        value={formData.specialEventCity}
                        onChange={(e) =>
                          setFormData({ ...formData, specialEventCity: e.target.value })
                        }
                        placeholder="Ex: Paris"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialEventCategory">Catégorie d'événement</Label>
                    <Select
                      value={formData.specialEventCategory}
                      onValueChange={(value) =>
                        setFormData({ ...formData, specialEventCategory: value as any })
                      }
                    >
                      <SelectTrigger id="specialEventCategory">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucune</SelectItem>
                        <SelectItem value="blockbuster">Blockbuster</SelectItem>
                        <SelectItem value="tendance">Tendance</SelectItem>
                        <SelectItem value="insolite">Insolite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
              {isEditing ? "Mise à jour..." : "Création..."}
            </>
          ) : (
            <>
              <SolarIcon icon="check-circle-bold" className="size-4 mr-2" />
              {isEditing ? "Enregistrer les modifications" : "Créer la décision"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

