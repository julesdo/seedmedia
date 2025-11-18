"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { useMutation } from "convex/react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/articles/ImageUpload";
import { TagsInput } from "@/components/articles/TagsInput";
import { ArticleSectionEditor, ArticleSection } from "@/components/articles/ArticleSectionEditor";
import { ClaimsManager } from "@/components/articles/ClaimsManager";
import { Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const ARTICLE_TYPES = [
  { value: "scientific", label: "Scientifique" },
  { value: "expert", label: "Expert" },
  { value: "opinion", label: "Opinion" },
  { value: "news", label: "Actualité" },
  { value: "tutorial", label: "Tutoriel" },
  { value: "other", label: "Autre" },
] as const;

export default function NewArticlePage() {
  const router = useTransitionRouter();
  const createArticle = useMutation(api.articles.createArticle);
  const updateArticle = useMutation(api.articles.updateArticle);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [sections, setSections] = useState<ArticleSection[]>([
    {
      id: "section-1",
      title: "Introduction",
      content: "",
      order: 0,
      wordCount: 0,
      hasClaims: false,
    },
  ]);
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [articleType, setArticleType] = useState<
    "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other"
  >("scientific");
  const [status, setStatus] = useState<"draft" | "pending" | "published">(
    "draft"
  );
  const [loading, setLoading] = useState(false);
  const [createdArticleId, setCreatedArticleId] = useState<
    Id<"articles"> | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarManuallyClosed, setSidebarManuallyClosed] = useState(false);
  const claimsSectionRef = useRef<HTMLDivElement | null>(null);
  // Stocker les images en attente d'upload (URL blob -> File)
  const [pendingImages, setPendingImages] = useState<Map<string, File>>(new Map());
  
  // Fonction pour nettoyer les blob URLs des images qui ne sont plus dans le contenu
  const cleanupOrphanedBlobUrls = useCallback((sections: ArticleSection[], currentPendingImages: Map<string, File>) => {
    // Extraire toutes les URLs blob de toutes les sections
    const blobUrlPattern = /blob:[^"'\s)]+/g;
    const blobUrlsInContent = new Set<string>();
    
    sections.forEach(section => {
      if (section.content) {
        try {
          const contentString = section.content;
          const matches = contentString.match(blobUrlPattern);
          if (matches) {
            matches.forEach(url => blobUrlsInContent.add(url));
          }
        } catch (error) {
          // Ignorer les erreurs de parsing
        }
      }
    });
    
    // Retirer de pendingImages les URLs blob qui ne sont plus dans le contenu
    // CRITIQUE: NE PAS RÉVOQUER LES BLOB URLS ICI
    // Les révoquer ici causerait ERR_FILE_NOT_FOUND quand l'image essaie de se charger
    // Les blob URLs doivent rester actifs jusqu'à ce qu'ils soient remplacés par des URLs Convex lors de l'upload final
    const urlsToRemove: string[] = [];
    currentPendingImages.forEach((file, blobUrl) => {
      if (!blobUrlsInContent.has(blobUrl)) {
        // Cette image n'est plus dans le contenu, la retirer de pendingImages
        // MAIS NE PAS RÉVOQUER LE BLOB URL - il peut encore être utilisé pour l'affichage
        urlsToRemove.push(blobUrl);
        console.log("🗑️ Cleanup: URL blob orpheline détectée (sera retirée mais PAS révoquée):", blobUrl);
        // ❌ URL.revokeObjectURL(blobUrl); // NE JAMAIS FAIRE ÇA ICI - ça casse l'affichage des images
      }
    });
    
    // Retirer les URLs des images supprimées (sans révoquer les blob URLs)
    if (urlsToRemove.length > 0) {
      const updatedPendingImages = new Map(currentPendingImages);
      urlsToRemove.forEach(url => {
        updatedPendingImages.delete(url);
      });
      console.log("✅ Cleanup: pendingImages mis à jour, retiré", urlsToRemove.length, "URLs orphelines (blob URLs non révoqués)");
      setPendingImages(updatedPendingImages);
    }
  }, []);
  
  // Mutations Convex pour l'upload d'images
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getFileUrl);


  const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0);

  // Fonction pour uploader toutes les images et remplacer les URLs blob par les URLs Convex
  const uploadPendingImages = useCallback(async (content: string): Promise<string> => {
    if (pendingImages.size === 0) {
      return content; // Pas d'images à uploader
    }

    try {
      // Map pour stocker les remplacements (blobUrl -> convexUrl)
      const urlReplacements = new Map<string, string>();

      // Uploader toutes les images en parallèle
      const uploadPromises = Array.from(pendingImages.entries()).map(async ([blobUrl, file]) => {
        try {
          // 1. Générer l'URL d'upload
          const uploadUrl = await generateUploadUrl();

          // 2. Uploader le fichier
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!result.ok) {
            throw new Error("Erreur lors de l'upload");
          }

          // 3. Récupérer le storageId
          const { storageId } = await result.json();

          // 4. Obtenir l'URL signée du fichier
          const fileUrl = await getFileUrl({ storageId: storageId as Id<"_storage"> });

          if (!fileUrl) {
            throw new Error("Impossible de récupérer l'URL du fichier");
          }

          // Stocker le remplacement
          urlReplacements.set(blobUrl, fileUrl);

          // Libérer l'URL blob
          URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error(`Erreur upload image ${blobUrl}:`, error);
          throw error;
        }
      });

      // Attendre que tous les uploads soient terminés
      await Promise.all(uploadPromises);

      // Remplacer toutes les URLs blob par les URLs Convex dans le contenu
      let updatedContent = content;
      urlReplacements.forEach((convexUrl, blobUrl) => {
        // Remplacer toutes les occurrences de l'URL blob par l'URL Convex
        updatedContent = updatedContent.replace(new RegExp(blobUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), convexUrl);
      });

      // Vider la map des images en attente
      setPendingImages(new Map());

      return updatedContent;
    } catch (error) {
      console.error("Erreur upload images:", error);
      toast.error("Erreur lors de l'upload des images");
      throw error;
    }
  }, [pendingImages, generateUploadUrl, getFileUrl]);
  
  // Nettoyer les blob URLs orphelines quand les sections changent
  useEffect(() => {
    cleanupOrphanedBlobUrls(sections, pendingImages);
  }, [sections, pendingImages, cleanupOrphanedBlobUrls]);

  const scrollToSubmitButton = () => {
    const submitButton = document.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );
    submitButton?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleClaimRequest = () => {
    if (!createdArticleId) {
      toast.info(
        "Enregistrez votre article avant d'ajouter des affirmations vérifiables."
      );
      scrollToSubmitButton();
      return false;
    }

    toast.info("Complétez vos affirmations dans la section dédiée.");
    claimsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    return true;
  };

  // Auto-générer le slug à partir du titre
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (!slug.trim()) {
      toast.error("Le slug est requis");
      return;
    }

    if (!summary.trim()) {
      toast.error("Le résumé est requis");
      return;
    }

    // Vérifier qu'au moins une section a du contenu
    const hasContent = sections.some((s) => {
      if (!s.content) return false;
      try {
        const container = JSON.parse(s.content);
        return container && container.children && container.children.length > 0;
      } catch {
        return false;
      }
    });
    if (!hasContent) {
      toast.error("Au moins une section doit contenir du contenu");
      return;
    }

    // Sérialiser toutes les sections en un objet JSON
    // Chaque section contient son ContainerNode Mina Rich Editor
    let content = JSON.stringify({
      sections: sections
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          id: s.id,
          title: s.title,
          content: s.content ? JSON.parse(s.content) : null, // ContainerNode
          order: s.order,
        })),
    });

    if (tags.length === 0) {
      toast.error("Ajoutez au moins un tag");
      return;
    }

    setLoading(true);

    try {
      // Uploader les images et remplacer les URLs blob
      content = await uploadPendingImages(content);

      const result = await createArticle({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        content: content.trim(),
        tags,
        coverImage,
        articleType,
        status,
      });

      toast.success(
        status === "published"
          ? "Article publié avec succès"
          : "Article sauvegardé en brouillon"
      );

      // Stocker l'ID de l'article créé pour afficher le ClaimsManager
      setCreatedArticleId(result.articleId);
      
      // Pousser vers la zone des affirmations en brouillon
      if (status !== "published") {
        toast.info(
          "Article sauvegardé ! Ajoutez maintenant des affirmations vérifiables pour améliorer sa qualité."
        );
        claimsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      // Si publié, rediriger vers l'article
      if (status === "published") {
        router.push(`/discover/articles/${slug}`);
      }
    } catch (error: any) {
      console.error("Erreur création article:", error);
      toast.error(error.message || "Erreur lors de la création de l'article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-light mb-2 tracking-tight">
              Nouvel article scientifique
            </h1>
            <p className="text-sm text-muted-foreground/80 font-medium">
              Rédigez un document rigoureux, documenté et vérifiable
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !sidebarOpen;
              setSidebarOpen(newState);
              setSidebarManuallyClosed(!newState); // Marquer comme fermée/ouverte manuellement
            }}
            className="h-9 w-9 p-0"
            title={sidebarOpen ? "Masquer la sidebar" : "Afficher la sidebar"}
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div 
          className={cn(
            "grid grid-cols-1 gap-8 transition-[grid-template-columns] duration-500 ease-in-out",
            !sidebarOpen ? "lg:grid-cols-1" : "lg:grid-cols-12"
          )}
        >
          {/* Zone principale - Rédaction */}
          <div 
            className={cn(
              "space-y-6 transition-[max-width] duration-500 ease-in-out",
              !sidebarOpen ? "lg:col-span-1" : "lg:col-span-8"
            )}
          >
            {/* Informations de base */}
            <div className="space-y-6 pb-6 border-b border-border/20">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Titre de l'article
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Titre principal de votre recherche ou analyse"
                  required
                  className="text-xl font-semibold h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="summary" className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Résumé / Abstract
                </Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Résumé concis présentant l'objectif, la méthodologie et les conclusions principales (150-200 mots recommandés)"
                  rows={4}
                  required
                  className="resize-none text-base leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground/70 font-medium">
                    {summary.length}/200 caractères
                  </p>
                  <p className="text-xs text-muted-foreground/60 italic">
                    Format académique recommandé
                  </p>
                </div>
              </div>
            </div>

            {/* Sections de rédaction */}
            <ArticleSectionEditor
              sections={sections}
              onChange={setSections}
              onAddClaim={() => handleClaimRequest()}
              onImagesChange={setPendingImages}
            />

            {/* Affirmations */}
            <div ref={claimsSectionRef} className="scroll-mt-24 pt-6 border-t border-border/20">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground mb-1">Affirmations vérifiables</h2>
                <p className="text-sm text-muted-foreground/70">
                  Documentez vos sources et rendez vos affirmations vérifiables par la communauté
                </p>
              </div>
              {createdArticleId ? (
                <ClaimsManager articleId={createdArticleId} />
              ) : (
                <Card className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground/80 font-medium">
                      Enregistrez votre brouillon pour commencer à ajouter des affirmations vérifiables et leurs sources.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar - Paramètres */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside 
                className="space-y-4 lg:sticky lg:top-24 h-fit lg:col-span-4"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
            <Card className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-gradient-light uppercase tracking-wide">Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium text-foreground">
                    Slug
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-de-votre-article"
                    required
                  />
                  <p className="text-xs text-muted-foreground/70">
                    URL : /articles/{slug || "..."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="articleType" className="text-sm font-medium text-foreground">
                    Type
                  </Label>
                  <Select
                    value={articleType}
                    onValueChange={(value: any) => setArticleType(value)}
                  >
                    <SelectTrigger id="articleType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTICLE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-foreground">
                    Statut
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value: any) => setStatus(value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="published">Publier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-gradient-light uppercase tracking-wide">Métadonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  label="Image de couverture"
                  description="Image principale (optionnel)"
                />

                <TagsInput
                  value={tags}
                  onChange={setTags}
                  label="Tags"
                  description="Ajoutez au moins un tag"
                  placeholder="Appuyez sur Entrée pour ajouter"
                />
              </CardContent>
            </Card>
          </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center gap-4 mt-10 pt-6 border-t border-border/20">
          <div className="text-sm text-muted-foreground/70">
            <span className="font-medium">{totalWordCount}</span> mots au total
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="font-medium"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="font-semibold min-w-[120px]">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : status === "published" ? (
                "Publier l'article"
              ) : (
                "Enregistrer le brouillon"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
