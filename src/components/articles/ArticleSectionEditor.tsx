"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PlateEditorWrapper, extractTextFromPlateValue } from "./PlateEditorWrapper";
import type { TElement } from "platejs";

export interface ArticleSection {
  id: string;
  title: string;
  content: string; // JSON stringifié du contenu Plate.js
  order: number;
  wordCount: number;
  hasClaims: boolean;
}

interface ArticleSectionEditorProps {
  sections: ArticleSection[];
  onChange: (sections: ArticleSection[]) => void;
  onAddClaim?: (sectionId: string) => boolean;
  onImagesChange?: (images: Map<string, File>) => void; // Callback pour notifier les changements d'images
}

export function ArticleSectionEditor({
  sections,
  onChange,
  onAddClaim,
  onImagesChange,
}: ArticleSectionEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([sections[0]?.id].filter(Boolean) as string[])
  );
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  
  // Stocker les fichiers images avec leurs URLs blob temporaires
  const pendingImagesRef = useRef<Map<string, File>>(new Map());
  
  // Stocker la fonction de callback dans un ref pour éviter les re-renders
  const onImagesChangeRef = useRef(onImagesChange);
  
  // Mettre à jour le ref quand la fonction change
  useEffect(() => {
    onImagesChangeRef.current = onImagesChange;
  }, [onImagesChange]);

  // Fonction pour créer une URL blob temporaire au lieu d'uploader immédiatement
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      // Validation
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier doit être une image");
        throw new Error("Le fichier doit être une image");
      }

      // Limite de taille : 10 Mo
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("L'image ne doit pas dépasser 10 Mo");
        throw new Error("L'image ne doit pas dépasser 10 Mo");
      }

      // Créer une URL blob temporaire
      const blobUrl = URL.createObjectURL(file);
      
      // Vérifier que le blob URL est valide
      if (!blobUrl || !blobUrl.startsWith('blob:')) {
        throw new Error("Erreur lors de la création de l'URL blob");
      }
      
      console.log("✅ Blob URL créé:", blobUrl, "pour fichier:", file.name, "taille:", file.size, "type:", file.type);
      
      // IMPORTANT: Vérifier que le fichier est toujours accessible
      // Créer un test pour vérifier que le blob est valide
      try {
        const testImg = new Image();
        testImg.onload = () => {
          console.log("✅ Blob URL test réussi - l'image est accessible:", blobUrl);
        };
        testImg.onerror = () => {
          console.error("❌ Blob URL test échoué - l'image n'est pas accessible:", blobUrl);
        };
        testImg.src = blobUrl;
      } catch (err) {
        console.error("❌ Erreur lors du test du blob URL:", err);
      }
      
      // Stocker le fichier avec l'URL blob comme clé
      pendingImagesRef.current.set(blobUrl, file);
      
      // Vérifier que le fichier est bien stocké
      const storedFile = pendingImagesRef.current.get(blobUrl);
      if (!storedFile) {
        console.error("❌ Erreur: fichier non stocké dans pendingImagesRef");
        URL.revokeObjectURL(blobUrl);
        throw new Error("Erreur lors du stockage du fichier");
      }
      
      console.log("✅ Fichier stocké dans pendingImagesRef, total:", pendingImagesRef.current.size);
      
      // Notifier le parent des changements via le ref
      if (onImagesChangeRef.current) {
        onImagesChangeRef.current(new Map(pendingImagesRef.current));
      }

      // Retourner l'URL blob temporaire
      return blobUrl;
    } catch (error) {
      console.error("Erreur création URL blob:", error);
      toast.error("Erreur lors de la préparation de l'image");
      throw error;
    }
  }, []); // Pas de dépendances pour garder la fonction stable

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const addSection = () => {
    const newSection: ArticleSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      content: "",
      order: sections.length,
      wordCount: 0,
      hasClaims: false,
    };
    onChange([...sections, newSection]);
    setExpandedSections((prev) => new Set([...prev, newSection.id]));
    setEditingTitle(newSection.id);
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) {
      return; // Garder au moins une section
    }
    onChange(sections.filter((s) => s.id !== id));
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateSection = (
    id: string,
    updates: Partial<ArticleSection>
  ) => {
    onChange(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const calculateWordCount = (content: string): number => {
    try {
      if (!content) return 0;
      const parsed = JSON.parse(content) as TElement[];
      // Utiliser la fonction utilitaire pour extraire le texte
      const text = extractTextFromPlateValue(parsed);
      return text.split(/\s+/).filter((w: string) => w.length > 0).length;
    } catch {
      return 0;
    }
  };

  const handleContentChange = (id: string, content: string) => {
    const wordCount = calculateWordCount(content);
    updateSection(id, { content, wordCount });
    
    // Nettoyer les blob URLs des images qui ne sont plus dans le contenu
    // SIMPLIFIÉ: On ne révoque JAMAIS les blob URLs ici, seulement on les retire de pendingImagesRef
    // Les blob URLs seront révoqués lors de l'upload final ou du nettoyage du composant
    try {
      if (!content) return;
      
      // Fonction récursive pour extraire les blob URLs du format Plate.js
      const extractBlobUrls = (node: any, blobUrls: Set<string>): void => {
        if (!node) return;
        
        // Plate.js peut avoir des images dans différents formats
        if (node.type === 'img' || node.type === 'image') {
          const src = node.url || node.src || node.attributes?.src;
          if (src && typeof src === 'string' && src.startsWith('blob:')) {
            blobUrls.add(src);
          }
        }
        
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => extractBlobUrls(child, blobUrls));
        }
      };
      
      const parsed = JSON.parse(content) as TElement[];
      const blobUrlsInContent = new Set<string>();
      parsed.forEach((node) => extractBlobUrls(node, blobUrlsInContent));
      
      // Retirer de pendingImagesRef les URLs blob qui ne sont plus dans le contenu
      // MAIS NE PAS RÉVOQUER - on laisse les blob URLs actifs jusqu'à l'upload final
      const urlsToRemove: string[] = [];
      pendingImagesRef.current.forEach((file, blobUrl) => {
        if (!blobUrlsInContent.has(blobUrl)) {
          urlsToRemove.push(blobUrl);
        }
      });
      
      // Retirer les URLs des images supprimées (sans révoquer)
      urlsToRemove.forEach(url => {
        pendingImagesRef.current.delete(url);
      });
      
      // Notifier le parent des changements si nécessaire
      if (urlsToRemove.length > 0 && onImagesChangeRef.current) {
        onImagesChangeRef.current(new Map(pendingImagesRef.current));
      }
    } catch (error) {
      // Ignorer les erreurs de parsing
      console.warn("Erreur lors du nettoyage des blob URLs:", error);
    }
  };


  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isExpanded = expandedSections.has(section.id);
        const isEditingTitle = editingTitle === section.id;

        return (
          <Card
            key={section.id}
            className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg"
            style={{ position: 'relative' }}
          >
            <CardContent className="p-0">
              {/* Header de section - Entièrement cliquable */}
              <div 
                className="p-5 border-b border-border/20 cursor-pointer hover:bg-background/30 transition-colors"
                onClick={(e) => {
                  // Ne pas toggle si on clique sur les boutons d'action ou les inputs
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('input')) {
                    return;
                  }
                  toggleSection(section.id);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex flex-col items-center justify-center shrink-0 pt-0.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    {isEditingTitle ? (
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(section.id, { title: e.target.value })
                        }
                        onBlur={() => setEditingTitle(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setEditingTitle(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 font-semibold text-lg"
                        autoFocus
                        placeholder="Titre de la section"
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-foreground tracking-tight">
                            {section.title || `Section ${index + 1}`}
                          </h3>
                          <div className="flex items-center justify-center w-5 h-5 shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground/70 font-medium">
                            {section.wordCount} {section.wordCount <= 1 ? 'mot' : 'mots'}
                          </span>
                          {section.hasClaims && (
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                              ✓ Vérifié
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitle(
                          isEditingTitle ? null : section.id
                        );
                      }}
                      className="h-8"
                    >
                      <SolarIcon icon="pen-bold" className="h-4 w-4" />
                    </Button>
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenu éditable */}
              {isExpanded && (
                <div 
                  className="p-6 space-y-4"
                  data-section-editor="true"
                  onMouseDown={(e) => {
                    // Empêcher le changement de focus vers l'input titre quand on clique dans la section éditeur
                    const target = e.target as HTMLElement
                    // Si on clique sur un bouton ou un élément interactif, empêcher le changement de focus
                    if (target.closest('button') || target.closest('[role="button"]')) {
                      e.preventDefault()
                      e.stopPropagation()
                    }
                  }}
                >
                  <div className="h-[600px] border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-lg rounded-lg flex flex-col relative shadow-sm">
                    <PlateEditorWrapper
                      key={`editor-${section.id}`}
                      value={section.content}
                      onChange={(content) => {
                        // Ne mettre à jour que si le contenu a vraiment changé
                        if (content !== section.content) {
                          handleContentChange(section.id, content);
                        }
                      }}
                      placeholder="Commencez à écrire votre section..."
                    />
                  </div>

                  {/* Bouton pour ajouter des claims */}
                  {onAddClaim && (
                    <div className="flex items-center justify-between pt-3 border-t border-border/20">
                      <p className="text-xs text-muted-foreground/80">
                        {section.hasClaims
                          ? "Cette section contient des affirmations vérifiables"
                          : "Ajoutez des affirmations vérifiables pour améliorer la qualité"}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const handled = onAddClaim?.(section.id);
                          if (handled) {
                            updateSection(section.id, { hasClaims: true });
                          }
                        }}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1.5" />
                        Ajouter une affirmation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une section
      </Button>
    </div>
  );
}
