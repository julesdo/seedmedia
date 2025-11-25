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
import { PlateEditorWrapper, extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { normalizeNodeId } from "platejs";
import type { TElement } from "platejs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Link from "next/link";
import { CredibilityGainBadge } from "@/components/credibility/CredibilityGainBadge";
import { CredibilityIndicator } from "@/components/credibility/CredibilityIndicator";
import { useCredibilityPoints } from "@/hooks/useCredibilityPoints";

const ARTICLE_TYPES = [
  { value: "scientific", label: "Scientifique" },
  { value: "expert", label: "Expert" },
  { value: "opinion", label: "Opinion" },
  { value: "news", label: "Actualité" },
  { value: "tutorial", label: "Tutoriel" },
  { value: "other", label: "Autre" },
] as const;

const defaultPlateValue = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

export default function NewArticlePage() {
  const router = useRouter();
  const createArticle = useMutation(api.articles.createArticle);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Métadonnées de base
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]); // Pour les catégories par défaut (pas encore en base)
  const [articleType, setArticleType] = useState<
    "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other"
  >("scientific");
  const [status, setStatus] = useState<"draft" | "pending">("draft");
  
  // Récupérer les catégories disponibles pour les articles
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "articles",
  });

  // Structure obligatoire selon NEW_SEED.md
  const [these, setThese] = useState<string>("");
  const [content, setContent] = useState<string>(JSON.stringify(defaultPlateValue));
  const [counterArguments, setCounterArguments] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  
  const [newCounterArgument, setNewCounterArgument] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation de la structure obligatoire
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    if (!summary.trim()) errors.push("Le résumé (TL;DR) est obligatoire");
    if (!these.trim()) errors.push("La thèse / problème est obligatoire");
    
    const contentText = extractTextFromPlateValue(JSON.parse(content || JSON.stringify(defaultPlateValue)) as TElement[]);
    if (!contentText.trim()) errors.push("Le développement est obligatoire");
    
    if (sources.length < 2) errors.push("Au moins 2 sources sont obligatoires");
    if (counterArguments.length < 1) errors.push("Au moins 1 contre-argument est obligatoire");
    if (!conclusion.trim()) errors.push("La conclusion est obligatoire");
    
    return errors;
  }, [title, summary, these, content, sources.length, counterArguments.length, conclusion]);

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
    
    if (!canPublish && status === "pending") {
      toast.error("Veuillez compléter tous les champs obligatoires avant de soumettre");
      return;
    }

    setLoading(true);
    try {
      const articleId = await createArticle({
        title,
        slug: slug || `article-${Date.now()}`,
        summary,
        coverImage: coverImage || undefined,
        content,
        tags,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        articleType,
        status,
        these,
        counterArguments,
        conclusion,
        sourcesCount: sources.length,
      });

      toast.success(
        status === "pending"
          ? "Article soumis pour validation !"
          : "Article sauvegardé comme brouillon"
      );
      
      router.push(`/studio/articles/${articleId}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'article");
    } finally {
      setLoading(false);
    }
  };

  const addCounterArgument = () => {
    if (newCounterArgument.trim()) {
      setCounterArguments([...counterArguments, newCounterArgument.trim()]);
      setNewCounterArgument("");
    }
  };

  const removeCounterArgument = (index: number) => {
    setCounterArguments(counterArguments.filter((_, i) => i !== index));
  };

  const addSource = () => {
    if (newSource.trim()) {
      setSources([...sources, newSource.trim()]);
      setNewSource("");
    }
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Raccourci clavier Cmd/Ctrl + S pour sauvegarder
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, summary, content, these, sources, counterArguments, conclusion, status, articleType, tags]);

  // Contenu de la sidebar (réutilisable pour mobile et desktop)
  const sidebarContent = (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b shrink-0 bg-background">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">Métadonnées</h2>
          <p className="text-xs text-muted-foreground">
            Configurez votre article et sa structure obligatoire
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-3 space-y-4">
              {/* Alerts de validation */}
              {validationErrors.length > 0 && status === "pending" && (
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
                  Résumé (TL;DR) <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Résumé court de l'article (150-300 mots)"
                  rows={3}
                  className="text-xs h-auto"
                />
              </div>

              <Separator />

              {/* Image de couverture */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Image de couverture
                </Label>
                <ImageUpload
                  value={coverImage}
                  onChange={(url) => setCoverImage(url)}
                  variant="cover"
                  aspectRatio={16 / 9}
                  label=""
                  description=""
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Type et Statut */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="articleType" className="text-xs font-semibold text-foreground">
                    Type
                  </Label>
                  <Select
                    value={articleType}
                    onValueChange={(value: any) => setArticleType(value)}
                  >
                    <SelectTrigger id="articleType" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTICLE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-xs">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs font-semibold text-foreground">
                    Statut
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value: "draft" | "pending") => setStatus(value)}
                  >
                    <SelectTrigger id="status" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-xs">Brouillon</SelectItem>
                      <SelectItem value="pending" disabled={!canPublish} className="text-xs">
                        Soumettre
                        {!canPublish && " (incomplet)"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {status === "pending" && canPublish && (
                    <CredibilityIndicator 
                      points={credibilityPoints.articlePublished} 
                      action="Gagnez" 
                      variant="compact"
                      className="mt-1.5"
                    />
                  )}
                </div>
              </div>

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

              {/* Structure obligatoire */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold mb-2 text-foreground">Structure obligatoire</h3>
                  
                  {/* Thèse */}
                  <div className="space-y-1 mb-3">
                    <Label htmlFor="these" className="text-xs font-semibold text-foreground">
                      Thèse / Problème <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="these"
                      value={these}
                      onChange={(e) => setThese(e.target.value)}
                      placeholder="Formulez la thèse centrale..."
                      rows={2}
                      className="text-xs h-auto"
                    />
                  </div>

                  {/* Sources */}
                  <div className="space-y-1 mb-3">
                    <Label htmlFor="sources" className="text-xs font-semibold text-foreground">
                      Sources <span className="text-destructive">*</span>{" "}
                      <span className="text-[10px] text-muted-foreground">
                        (min 2)
                      </span>
                    </Label>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {sources.map((source, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <Input value={source} readOnly className="h-6 text-[10px]" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeSource(index)}
                          >
                            <SolarIcon icon="trash-bin-trash-bold" className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Input
                        id="sources"
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        placeholder="URL ou référence"
                        className="h-6 text-[10px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSource();
                          }
                        }}
                      />
                      <Button type="button" onClick={addSource} size="sm" variant="outline" className="h-6 w-6 p-0">
                        <SolarIcon icon="add-circle-bold" className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    {sources.length < 2 && (
                      <p className="text-[10px] text-muted-foreground">
                        {2 - sources.length} source(s) supplémentaire(s) requise(s)
                      </p>
                    )}
                  </div>

                  {/* Contre-arguments */}
                  <div className="space-y-1 mb-3">
                    <Label htmlFor="counterArguments" className="text-xs font-semibold text-foreground">
                      Contre-arguments <span className="text-destructive">*</span>{" "}
                      <span className="text-[10px] text-muted-foreground">
                        (min 1)
                      </span>
                    </Label>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {counterArguments.map((arg, index) => (
                        <div key={index} className="flex items-start gap-1">
                          <Textarea value={arg} readOnly rows={1} className="text-[10px] h-auto" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeCounterArgument(index)}
                          >
                            <SolarIcon icon="trash-bin-trash-bold" className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Textarea
                        id="counterArguments"
                        value={newCounterArgument}
                        onChange={(e) => setNewCounterArgument(e.target.value)}
                        placeholder="Formulez un contre-argument..."
                        rows={2}
                        className="text-xs h-auto"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            addCounterArgument();
                          }
                        }}
                      />
                      <Button type="button" onClick={addCounterArgument} size="sm" variant="outline" className="shrink-0 h-6 w-6 p-0">
                        <SolarIcon icon="add-circle-bold" className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    {counterArguments.length < 1 && (
                      <p className="text-[10px] text-muted-foreground">
                        Au moins 1 contre-argument est requis
                      </p>
                    )}
                  </div>

                  {/* Conclusion */}
                  <div className="space-y-1">
                    <Label htmlFor="conclusion" className="text-xs font-semibold text-foreground">
                      Conclusion (orientée solutions) <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="conclusion"
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      placeholder="Proposez une conclusion orientée solutions..."
                      rows={3}
                      className="text-xs h-auto"
                    />
                  </div>
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
              placeholder="Titre de l'article..."
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
              disabled={loading}
              variant={status === "pending" ? "default" : "outline"}
              size="sm"
            >
              {loading ? (
                <>
                  <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                  {status === "pending" ? "Soumission..." : "Sauvegarde..."}
                </>
              ) : status === "pending" ? (
                <>
                  <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                      Soumettre
                      <CredibilityGainBadge points={credibilityPoints.articlePublished} size="sm" className="ml-2" />
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
                  value={content}
                  onChange={setContent}
                  placeholder="Commencez à rédiger votre article..."
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sidebar Desktop - Métadonnées et structure obligatoire avec scroll */}
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
