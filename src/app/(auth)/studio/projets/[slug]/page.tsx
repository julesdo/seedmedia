"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
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
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeNodeId } from "platejs";

const STAGE_OPTIONS = [
  { value: "idea", label: "Idée" },
  { value: "prototype", label: "Prototype" },
  { value: "beta", label: "Bêta" },
  { value: "production", label: "Production" },
] as const;

const LINK_TYPES = [
  { value: "website", label: "Site web" },
  { value: "github", label: "GitHub" },
  { value: "demo", label: "Démo" },
  { value: "documentation", label: "Documentation" },
  { value: "other", label: "Autre" },
] as const;

const defaultPlateValue = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Essayer de récupérer par slug d'abord, sinon par ID si slug est en fait un ID
  const isIdFormat = slug.match(/^[a-z0-9]{32}$/i);
  const projectBySlug = useQuery(
    api.projects.getProjectBySlug,
    !isIdFormat ? { slug } : "skip"
  );
  const projectById = useQuery(
    api.projects.getProjectById,
    isIdFormat ? { projectId: slug as any } : "skip"
  );
  const project = projectBySlug || projectById;
  const updateProject = useMutation(api.projects.updateProject);
  const userOrganizations = useQuery(api.organizations.getUserOrganizations);
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "projects",
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Métadonnées de base
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState<string>(JSON.stringify(defaultPlateValue));
  const [tags, setTags] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]); // Pour les catégories par défaut (pas encore en base)
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState<"idea" | "prototype" | "beta" | "production">("idea");
  const [openSource, setOpenSource] = useState(false);

  // Localisation
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    region?: string;
    country?: string;
  } | null>(null);

  // Images (multiples)
  const [images, setImages] = useState<string[]>([]);

  // Liens externes
  const [links, setLinks] = useState<Array<{ type: string; url: string }>>([]);
  const [newLinkType, setNewLinkType] = useState("website");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Métriques d'impact
  const [impactMetrics, setImpactMetrics] = useState<Array<{ label: string; value: string }>>([]);
  const [newMetricLabel, setNewMetricLabel] = useState("");
  const [newMetricValue, setNewMetricValue] = useState("");

  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser les valeurs depuis le projet
  useEffect(() => {
    if (project && !isInitialized) {
      setTitle(project.title || "");
      setSummary(project.summary || "");
      setDescription(project.description || JSON.stringify(defaultPlateValue));
      setTags(project.tags || []);
      setCategoryIds(project.categoryIds?.map((id) => id) || []);
      setOrgId(project.orgId || undefined);
      setStage(project.stage || "idea");
      setOpenSource(project.openSource || false);
      setLocation(project.location || null);
      setImages(project.images || []);
      setLinks(project.links || []);
      setImpactMetrics(project.impactMetrics || []);
      setIsInitialized(true);
    }
  }, [project, isInitialized]);

  // Validation
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    if (!summary.trim()) errors.push("Le résumé est obligatoire");
    
    return errors;
  }, [title, summary]);

  const canSave = validationErrors.length === 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!project) {
      toast.error("Projet introuvable");
      return;
    }
    
    if (!canSave) {
      toast.error("Veuillez compléter tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await updateProject({
        projectId: project._id,
        title,
        summary,
        description,
        tags,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        location: location || undefined,
        images,
        links,
        stage,
        impactMetrics,
        openSource,
      });

      toast.success("Projet mis à jour avec succès !");
      router.push("/studio/projets");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du projet");
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

  const addLink = () => {
    if (newLinkUrl.trim()) {
      setLinks([...links, { type: newLinkType, url: newLinkUrl.trim() }]);
      setNewLinkUrl("");
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const addMetric = () => {
    if (newMetricLabel.trim() && newMetricValue.trim()) {
      setImpactMetrics([
        ...impactMetrics,
        { label: newMetricLabel.trim(), value: newMetricValue.trim() },
      ]);
      setNewMetricLabel("");
      setNewMetricValue("");
    }
  };

  const removeMetric = (index: number) => {
    setImpactMetrics(impactMetrics.filter((_, i) => i !== index));
  };

  const addImage = (url: string) => {
    if (url && !images.includes(url)) {
      setImages([...images, url]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  if (project === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>
            Projet non trouvé. Il a peut-être été supprimé ou vous n'avez pas les permissions pour l'éditer.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b shrink-0 bg-background">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">Métadonnées</h2>
          <p className="text-xs text-muted-foreground">
            Configurez votre projet
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
              placeholder="Résumé court du projet"
              rows={3}
              className="text-xs h-auto"
            />
          </div>

          <Separator />

          {/* Organisation */}
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

          {/* Stage */}
          <div className="space-y-1.5">
            <Label htmlFor="stage" className="text-xs font-semibold text-foreground">
              Stade du projet
            </Label>
            <Select
              value={stage}
              onValueChange={(value: any) => setStage(value)}
            >
              <SelectTrigger id="stage" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Open Source */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="openSource"
              checked={openSource}
              onChange={(e) => setOpenSource(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="openSource" className="text-xs font-semibold text-foreground cursor-pointer">
              Projet open source
            </Label>
          </div>

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

          <Separator />

          {/* Images */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Images du projet
            </Label>
            <div className="space-y-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <SolarIcon icon="trash-bin-trash-bold" className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <ImageUpload
                value={null}
                onChange={(url) => {
                  if (url) addImage(url);
                }}
                label="Ajouter une image"
                variant="default"
              />
            </div>
          </div>

          <Separator />

          {/* Liens externes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Liens externes
            </Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    {LINK_TYPES.find((t) => t.value === link.type)?.label || link.type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground truncate flex-1">
                    {link.url}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeLink(index)}
                  >
                    <SolarIcon icon="trash-bin-trash-bold" className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Select value={newLinkType} onValueChange={setNewLinkType}>
                <SelectTrigger className="h-7 text-xs w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="URL"
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <Button type="button" onClick={addLink} size="sm" variant="outline" className="h-7 w-7 p-0">
                <SolarIcon icon="add-circle-bold" className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Métriques d'impact */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Métriques d'impact
            </Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {impactMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="text-[10px] font-medium">{metric.label}:</span>
                  <span className="text-[10px] text-muted-foreground">{metric.value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-auto"
                    onClick={() => removeMetric(index)}
                  >
                    <SolarIcon icon="trash-bin-trash-bold" className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                value={newMetricLabel}
                onChange={(e) => setNewMetricLabel(e.target.value)}
                placeholder="Label"
                className="h-7 text-xs"
              />
              <Input
                value={newMetricValue}
                onChange={(e) => setNewMetricValue(e.target.value)}
                placeholder="Valeur"
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMetric();
                  }
                }}
              />
              <Button type="button" onClick={addMetric} size="sm" variant="outline" className="h-7 w-7 p-0">
                <SolarIcon icon="add-circle-bold" className="h-2.5 w-2.5" />
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
              placeholder="Titre du projet..."
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
              disabled={loading || !canSave}
              variant="default"
              size="sm"
            >
              {loading ? (
                <>
                  <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <SolarIcon icon="save-bold" className="h-4 w-4 mr-2" />
                  Enregistrer
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
                  placeholder="Décrivez votre projet en détail..."
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

