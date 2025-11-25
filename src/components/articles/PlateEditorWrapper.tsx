'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { Editor } from 'slate';
import type { TElement } from 'platejs';
import { toast } from 'sonner';

import { SectionEditorKit } from '@/components/section-editor-kit';
import { ReadOnlyEditorKit } from '@/components/read-only-editor-kit';
import { Editor as PlateEditor, EditorContainer } from '@/components/ui/editor';
import { ImageUploadProvider } from '@/components/articles/ImageUploadContext';
import { cn } from '@/lib/utils';

interface PlateEditorWrapperProps {
  value?: string; // JSON stringifié du contenu Plate.js
  onChange?: (value: string) => void; // Callback avec le JSON stringifié
  placeholder?: string;
  readOnly?: boolean;
  onImagesChange?: (images: Map<string, File>) => void; // Callback pour notifier les changements d'images
}

// Valeur par défaut pour un éditeur vide
const defaultValue = normalizeNodeId([
  {
    children: [{ text: '' }],
    type: 'p',
  },
]);

/**
 * Extrait le texte brut d'un éditeur Plate.js en utilisant l'API native Editor.string
 */
export function extractTextFromPlateEditor(editor: any): string {
  try {
    // Utiliser Editor.string de Slate pour extraire le texte brut
    return Editor.string(editor, []) || '';
  } catch {
    return '';
  }
}

/**
 * Extrait le texte brut d'un tableau de nodes Plate.js (sans éditeur)
 * Utilise une extraction récursive simple pour les cas où on n'a pas accès à l'éditeur
 */
export function extractTextFromPlateValue(value: TElement[]): string {
  if (!value || value.length === 0) {
    return '';
  }
  
  const extractFromNode = (node: any): string => {
    if (node.text !== undefined) {
      // C'est un TText (leaf node)
      return node.text || '';
    }
    
    // C'est un TElement (container node)
    if (!node.children || node.children.length === 0) {
      return '';
    }
    
    return node.children
      .map((child: any) => extractFromNode(child))
      .join('');
  };
  
  return value
    .map((node) => extractFromNode(node))
    .join('\n')
    .trim();
}

export function PlateEditorWrapper({
  value,
  onChange,
  placeholder = 'Type...',
  readOnly = false,
  onImagesChange,
}: PlateEditorWrapperProps) {
  // Parser la valeur depuis le JSON stringifié
  const parsedValue = useMemo(() => {
    if (!value) {
      return defaultValue;
    }
    try {
      const parsed = JSON.parse(value);
      // S'assurer que les IDs sont normalisés
      return normalizeNodeId(parsed);
    } catch {
      // En cas d'erreur, retourner la valeur par défaut
      return defaultValue;
    }
  }, [value]);

  const editor = usePlateEditor({
    plugins: readOnly ? ReadOnlyEditorKit : SectionEditorKit,
    value: parsedValue,
    readOnly,
  });

  // Ref pour éviter les appels onChange en boucle lors de la synchronisation
  const isInternalUpdate = useRef(false);
  
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
      
      // Stocker le fichier avec l'URL blob comme clé
      pendingImagesRef.current.set(blobUrl, file);
      
      // Notifier le parent des changements
      if (onImagesChangeRef.current) {
        onImagesChangeRef.current(new Map(pendingImagesRef.current));
      }
      
      return blobUrl;
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image:", error);
      throw error;
    }
  }, []);

  // Synchroniser la valeur externe avec l'éditeur
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const currentValue = editor.children;
    const currentValueString = JSON.stringify(currentValue);
    
    // Si la valeur externe est différente, mettre à jour l'éditeur
    if (value !== currentValueString) {
      try {
        const parsed = value ? JSON.parse(value) : defaultValue;
        const normalized = normalizeNodeId(parsed);
        // Utiliser l'API Plate pour mettre à jour la valeur
        editor.children = normalized;
        if (typeof editor.onChange === 'function') {
          editor.onChange();
        }
      } catch {
        // Ignorer les erreurs de parsing
      }
    }
  }, [value, editor]);

  // Fonction pour extraire les blob URLs du contenu et nettoyer les images orphelines
  const extractBlobUrls = useCallback((content: string) => {
    try {
      if (!content) return;
      
      // Fonction récursive pour extraire les blob URLs du format Plate.js
      const extractBlobUrlsRecursive = (node: any, blobUrls: Set<string>): void => {
        if (!node) return;
        
        // Plate.js peut avoir des images dans différents formats
        if (node.type === 'img' || node.type === 'image') {
          const src = node.url || node.src || node.attributes?.src;
          if (src && typeof src === 'string' && src.startsWith('blob:')) {
            blobUrls.add(src);
          }
        }
        
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => extractBlobUrlsRecursive(child, blobUrls));
        }
      };
      
      const parsed = JSON.parse(content) as TElement[];
      const blobUrlsInContent = new Set<string>();
      parsed.forEach((node) => extractBlobUrlsRecursive(node, blobUrlsInContent));
      
      // Retirer de pendingImagesRef les URLs blob qui ne sont plus dans le contenu
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
  }, []);

  // Handler pour les changements de l'éditeur
  // Le callback onChange de Plate reçoit l'éditeur, on doit utiliser editor.children
  const handleChange = useRef(() => {
    if (!onChange) return;
    
    isInternalUpdate.current = true;
    // Utiliser editor.children qui est sérialisable (pas de références circulaires)
    const valueString = JSON.stringify(editor.children);
    onChange(valueString);
    
    // Extraire les blob URLs et nettoyer les images orphelines
    extractBlobUrls(valueString);
  });

  // Mettre à jour le handler si onChange change
  useEffect(() => {
    handleChange.current = () => {
      if (!onChange) return;
      
      isInternalUpdate.current = true;
      // Utiliser editor.children qui est sérialisable
      const valueString = JSON.stringify(editor.children);
      onChange(valueString);
      
      // Extraire les blob URLs et nettoyer les images orphelines
      extractBlobUrls(valueString);
    };
  }, [editor, onChange, extractBlobUrls]);

  return (
    <ImageUploadProvider handleImageUpload={handleImageUpload}>
      <div className="h-full w-full flex flex-col" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
        <Plate 
          editor={editor}
          readOnly={readOnly}
          onChange={() => {
            handleChange.current();
          }}
        >
          <div className="h-full w-full flex flex-col overflow-hidden">
            <EditorContainer className="h-full flex flex-col min-h-0 overflow-hidden px-0">
              {/* Zone de contenu éditable avec padding */}
              <div 
                className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 lg:px-8"
                style={{ height: '100%', maxHeight: '100%' }}
              >
                <PlateEditor 
                  variant="demo" 
                  placeholder={placeholder} 
                  className={cn(
                    "w-full",
                    "!px-0 !pt-2 !pb-20 max-w-none!",
                    "!h-auto !min-h-full",
                    readOnly && "opacity-100 cursor-default"
                  )}
                />
              </div>
            </EditorContainer>
          </div>
        </Plate>
      </div>
    </ImageUploadProvider>
  );
}

