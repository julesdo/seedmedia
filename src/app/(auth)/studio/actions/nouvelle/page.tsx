"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
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
import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { normalizeNodeId } from "platejs";

const ACTION_TYPES = [
  { value: "petition", label: "Pétition" },
  { value: "contribution", label: "Contribution" },
  { value: "event", label: "Événement" },
] as const;

const defaultPlateValue = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

export default function NewActionPage() {
  const router = useRouter();
  const createAction = useMutation(api.actions.createAction);
  const userOrganizations = useQuery(api.organizations.getUserOrganizations);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Métadonnées de base
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState<string>(JSON.stringify(defaultPlateValue));
  const [tags, setTags] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]); // Pour les catégories par défaut (pas encore en base)
  const [actionType, setActionType] = useState<"petition" | "contribution" | "event">("petition");

  // Récupérer les catégories disponibles pour les actions
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "actions",
  });
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  // Localisation (pour les événements)
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    region?: string;
  } | null>(null);

  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation dynamique selon le type d'action
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    if (!summary.trim()) errors.push("Le résumé est obligatoire");
    
    // Validation spécifique selon le type
    if (actionType === "petition" && !target.trim()) {
      errors.push("La cible de la pétition est obligatoire");
    }
    
    if (actionType === "event") {
      if (!location) {
        errors.push("La localisation est obligatoire pour un événement");
      }
      if (!deadline) {
        errors.push("La date et heure de l'événement sont obligatoires");
      }
    }
    
    return errors;
  }, [title, summary, actionType, target, location, deadline]);

  const canPublish = validationErrors.length === 0;

  // Générer le slug depuis le titre
  const slug = React.useMemo(() => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, [title]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!canPublish) {
      toast.error("Veuillez compléter tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await createAction({
        title,
        slug: slug || `action-${Date.now()}`,
        summary,
        description,
        type: actionType,
        orgId: orgId ? (orgId as any) : undefined,
        tags,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        target: actionType === "petition" ? (target || undefined) : undefined,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        location: location || undefined,
      });

      toast.success("Action créée avec succès !");
      router.push("/studio/actions");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'action");
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b shrink-0 bg-background">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">Métadonnées</h2>
          <p className="text-xs text-muted-foreground">
            Configurez votre action
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-3 space-y-4">
          {/* Alerts de validation */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="py-2">
              <SolarIcon icon="danger-triangle-bold" className="h-3 w-3" />
              <AlertDescription className="text-[10px] mt-0.5">
                <div className="font-semibold mb-0.5">Champs manquants :</div>
                <ul className="list-disc list-inside space-y-0">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-[10px]">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Résumé */}
          <div className="space-y-1.5">
            <Label htmlFor="summary" className="text-xs font-semibold text-foreground">
              Résumé <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Résumé court de l'action"
              rows={3}
              className="text-xs h-auto"
            />
          </div>

          <Separator />

          {/* Type et Organisation */}
          <div className="space-y-2">
            <div className="space-y-1.5">
              <Label htmlFor="actionType" className="text-xs font-semibold text-foreground">
                Type d'action
              </Label>
              <Select
                value={actionType}
                onValueChange={(value: any) => {
                  setActionType(value);
                  // Réinitialiser les champs spécifiques au type précédent
                  setTarget("");
                  setDeadline("");
                  setLocation(null);
                }}
              >
                <SelectTrigger id="actionType" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orgId" className="text-xs font-semibold text-foreground">
                Organisation (optionnel)
              </Label>
              <Select
                value={orgId || "__none__"}
                onValueChange={(value) => setOrgId(value === "__none__" ? undefined : value)}
              >
                <SelectTrigger id="orgId" className="h-8 text-xs">
                  <SelectValue placeholder="Sélectionner une organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs">Aucune</SelectItem>
                  {userOrganizations?.map((org) => (
                    <SelectItem key={org._id} value={org._id} className="text-xs">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Champs spécifiques selon le type d'action */}
          {actionType === "petition" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="target" className="text-xs font-semibold text-foreground">
                  Cible de la pétition <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="Ex: Ministre de l'Environnement, Mairie de Paris..."
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  À qui s'adresse cette pétition ? Les utilisateurs pourront signer directement sur la plateforme.
                </p>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-xs font-semibold text-foreground">
                  Date limite de signature (optionnel)
                </Label>
                <Input
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  type="datetime-local"
                  className="h-8 text-xs"
                />
              </div>
            </>
          )}

          {actionType === "contribution" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-xs font-semibold text-foreground">
                  Date limite de contribution (optionnel)
                </Label>
                <Input
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  type="datetime-local"
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Les utilisateurs pourront contribuer directement sur la plateforme via le formulaire de contribution.
                </p>
              </div>
            </>
          )}

          {actionType === "event" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-xs font-semibold text-foreground">
                  Date et heure de l'événement <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  type="datetime-local"
                  className="h-8 text-xs"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Localisation <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Ville"
                    value={location?.city || ""}
                    onChange={(e) => setLocation({
                      ...(location || { lat: 0, lng: 0 }),
                      city: e.target.value,
                    })}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Région"
                    value={location?.region || ""}
                    onChange={(e) => setLocation({
                      ...(location || { lat: 0, lng: 0 }),
                      region: e.target.value,
                    })}
                    className="h-8 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      value={location?.lat || ""}
                      onChange={(e) => setLocation({
                        ...(location || { lng: 0, city: "", region: "" }),
                        lat: parseFloat(e.target.value) || 0,
                      })}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      value={location?.lng || ""}
                      onChange={(e) => setLocation({
                        ...(location || { lat: 0, city: "", region: "" }),
                        lng: parseFloat(e.target.value) || 0,
                      })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Les utilisateurs pourront s'inscrire directement à l'événement sur la plateforme.
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Catégories */}
          <div className="space-y-1.5">
            <Label htmlFor="categories" className="text-xs font-semibold text-foreground">
              Catégories
            </Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (!value) return;
                
                if (value.startsWith("slug:")) {
                  // Catégorie par défaut (pas encore en base)
                  const slug = value.replace("slug:", "");
                  if (!categorySlugs.includes(slug)) {
                    setCategorySlugs([...categorySlugs, slug]);
                  }
                } else {
                  // Catégorie en base
                  if (!categoryIds.includes(value)) {
                    setCategoryIds([...categoryIds, value]);
                  }
                }
              }}
            >
              <SelectTrigger id="categories" className="h-8 text-xs">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories
                  ?.filter((cat) => {
                    // Filtrer les catégories déjà sélectionnées
                    if (cat._id) {
                      return !categoryIds.includes(cat._id);
                    } else {
                      // Pour les catégories par défaut, utiliser le slug
                      return !categorySlugs.includes(cat.slug);
                    }
                  })
                  .map((category) => {
                    const value = category._id || `slug:${category.slug}`;
                    const key = category._id || `default-${category.slug}`;
                    return (
                      <SelectItem 
                        key={key} 
                        value={value} 
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <SolarIcon icon={category.icon as any} className="h-3 w-3" />
                          )}
                          <span>{category.name}</span>
                          {!category._id && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto">
                              Par défaut
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {(categoryIds.length > 0 || categorySlugs.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {/* Catégories en base */}
                {categoryIds.map((catId) => {
                  const category = availableCategories?.find((cat) => cat._id === catId);
                  if (!category) return null;
                  return (
                    <span
                      key={catId}
                      className="text-[10px] text-muted-foreground flex items-center gap-1"
                    >
                      {category.icon && (
                        <SolarIcon icon={category.icon as any} className="h-2.5 w-2.5" />
                      )}
                      {category.name}
                      <button
                        type="button"
                        onClick={() => setCategoryIds(categoryIds.filter((id) => id !== catId))}
                        className="ml-0.5 hover:text-destructive"
                      >
                        <SolarIcon icon="close-circle-bold" className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
                {/* Catégories par défaut (pas encore en base) */}
                {categorySlugs.map((slug) => {
                  const category = availableCategories?.find((cat) => !cat._id && cat.slug === slug);
                  if (!category) return null;
                  return (
                    <span
                      key={`slug-${slug}`}
                      className="text-[10px] text-muted-foreground flex items-center gap-1"
                    >
                      {category.icon && (
                        <SolarIcon icon={category.icon as any} className="h-2.5 w-2.5" />
                      )}
                      {category.name}
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1">
                        Par défaut
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setCategorySlugs(categorySlugs.filter((s) => s !== slug))}
                        className="ml-0.5 hover:text-destructive"
                      >
                        <SolarIcon icon="close-circle-bold" className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs font-semibold text-foreground">
              Tags
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0.5 h-5">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <SolarIcon icon="close-circle-bold" className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un tag"
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline" className="h-7 w-7 p-0">
                <SolarIcon icon="add-circle-bold" className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Main Content - Éditeur centré */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header compact - Fixe en haut */}
        <div className="border-b bg-background shrink-0 px-3 md:px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Mobile sidebar trigger */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                  <SolarIcon icon="sidebar-bold" className="h-5 w-5" />
                  <span className="sr-only">Ouvrir les métadonnées</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <SolarIcon icon={sidebarOpen ? "sidebar-minimalistic-bold" : "sidebar-code-bold"} className="h-5 w-5" />
              <span className="sr-only">Basculer les métadonnées</span>
            </Button>

            {/* Input titre dans le header */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'action..."
              className="text-lg md:text-xl font-semibold bg-transparent border-none outline-none flex-1 min-w-0 placeholder:text-muted-foreground focus:ring-0 p-0"
              autoFocus
            />
            
            {validationErrors.length > 0 && (
              <Badge variant="destructive" className="text-xs shrink-0">
                {validationErrors.length} erreur{validationErrors.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              size="sm"
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={loading || !canPublish}
              variant="default"
              size="sm"
            >
              {loading ? (
                <>
                  <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                  Créer l'action
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Editor Area - Scrollable avec toolbar fixe - Full width */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="w-full h-full flex flex-col">
            {/* Éditeur principal - Contenu scrollable avec hauteur fixe */}
            <div className="py-2 md:py-4 h-full flex flex-col min-h-0">
              <div className="h-full min-h-0">
                <PlateEditorWrapper
                  value={description}
                  onChange={setDescription}
                  placeholder="Décrivez votre action en détail..."
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sidebar Desktop - Métadonnées avec scroll */}
      <aside
        className={`hidden md:flex flex-col w-80 border-l bg-background shrink-0 h-full transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full absolute right-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </div>
  );
}

