"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

const DEFAULT_LANGUAGE = "fr";
const TRANSLATION_CACHE = new Map<string, string>();
const TRANSLATED_NODES = new WeakMap<Text, { original: string; language: string }>();

/**
 * Provider qui traduit automatiquement tous les textes dans le DOM
 * Utilise MutationObserver pour détecter les nouveaux textes et les traduire
 */
export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const { translate } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isTranslatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const observerRef = useRef<MutationObserver | null>(null);
  const [isReady, setIsReady] = useState(false);

  const translateTextNodes = useCallback(async () => {
    if (!containerRef.current) return;
    if (language === DEFAULT_LANGUAGE) {
      // Si on revient au français, restaurer les textes originaux
      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            
            const tagName = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'code', 'pre', 'textarea', 'input'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }

            const translatedInfo = TRANSLATED_NODES.get(node as Text);
            if (translatedInfo && translatedInfo.language !== DEFAULT_LANGUAGE) {
              return NodeFilter.FILTER_ACCEPT; // Restaurer ce nœud
            }

            return NodeFilter.FILTER_REJECT;
          },
        }
      );

      let node;
      while ((node = walker.nextNode())) {
        if (node instanceof Text) {
          const translatedInfo = TRANSLATED_NODES.get(node);
          if (translatedInfo) {
            node.textContent = translatedInfo.original;
            TRANSLATED_NODES.delete(node);
          }
        }
      }
      return;
    }

    if (isTranslatingRef.current) {
      return;
    }

    isTranslatingRef.current = true;
    
    // Attendre un peu pour que React finisse de rendre
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Sélectionner tous les éléments de texte
      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            
            const tagName = parent.tagName.toLowerCase();
            // Ignorer les éléments techniques
            if (['script', 'style', 'noscript', 'code', 'pre'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }

            // Ignorer les inputs et textareas (on les gère séparément)
            if (tagName === 'input' || tagName === 'textarea') {
              return NodeFilter.FILTER_REJECT;
            }

            // Vérifier si déjà traduit pour cette langue
            const translatedInfo = TRANSLATED_NODES.get(node as Text);
            if (translatedInfo && translatedInfo.language === language) {
              return NodeFilter.FILTER_REJECT;
            }

            const text = node.textContent?.trim() || '';
            if (text.length < 2) {
              return NodeFilter.FILTER_REJECT;
            }

            // Ignorer les nombres purs, URLs, emails, codes
            if (/^\d+$/.test(text) || 
                /^https?:\/\//.test(text) || 
                /@/.test(text) ||
                /^#[0-9a-fA-F]{3,6}$/.test(text) || // Couleurs hex
                /^[A-Z0-9_]+$/.test(text) && text.length > 5) { // Codes techniques
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const textNodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node instanceof Text) {
          textNodes.push(node);
        }
      }

      console.log(`[AutoTranslate] Found ${textNodes.length} text nodes to process`);

      // Filtrer et préparer les textes à traduire
      const textsToTranslate: Array<{ textNode: Text; originalText: string; cacheKey: string }> = [];
      
      for (const textNode of textNodes) {
        let originalText = textNode.textContent?.trim() || '';
        if (!originalText || originalText.length < 2) continue;

        // Si déjà traduit, restaurer l'original d'abord
        const translatedInfo = TRANSLATED_NODES.get(textNode);
        if (translatedInfo) {
          originalText = translatedInfo.original;
        }

        // Vérifier le cache d'abord
        const cacheKey = `${DEFAULT_LANGUAGE}_${language}_${originalText}`;
        if (TRANSLATION_CACHE.has(cacheKey)) {
          const cached = TRANSLATION_CACHE.get(cacheKey)!;
          textNode.textContent = cached;
          TRANSLATED_NODES.set(textNode, { original: originalText, language });
          continue;
        }

        // Traduire TOUS les textes (sauf ceux exclus)
        // Pas de détection de langue - on traduit tout ce qui est visible
        const isExcluded = 
          // Ignorer les nombres purs
          /^\d+$/.test(originalText) ||
          // Ignorer les URLs
          /^https?:\/\//.test(originalText) ||
          // Ignorer les emails
          /@/.test(originalText) ||
          // Ignorer les codes hex
          /^#[0-9a-fA-F]{3,6}$/.test(originalText) ||
          // Ignorer les codes techniques (majuscules seules de plus de 3 caractères)
          (/^[A-Z0-9_]+$/.test(originalText) && originalText.length > 3);

        if (!isExcluded) {
          textsToTranslate.push({ textNode, originalText, cacheKey });
        }
      }

      // Limiter le nombre de textes à traduire pour éviter trop d'appels API
      // Prendre seulement les 100 premiers textes uniques
      const uniqueTexts = new Map<string, Array<{ textNode: Text; originalText: string; cacheKey: string }>>();
      for (const item of textsToTranslate) {
        if (!uniqueTexts.has(item.originalText)) {
          uniqueTexts.set(item.originalText, []);
        }
        uniqueTexts.get(item.originalText)!.push(item);
      }
      
      const textsToProcess = Array.from(uniqueTexts.keys()).slice(0, 100);
      
      console.log(`[AutoTranslate] Processing ${textsToProcess.length} unique texts`);
      
      if (textsToProcess.length === 0) {
        console.log('[AutoTranslate] No texts to translate');
        isTranslatingRef.current = false;
        return;
      }
      
      // Traduire par batch de 50 textes uniques à la fois
      const apiBatchSize = 50;
      for (let i = 0; i < textsToProcess.length; i += apiBatchSize) {
        const batch = textsToProcess.slice(i, i + apiBatchSize);
        
        try {
          const response = await fetch("/api/translate/batch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              texts: batch,
              sourceLanguage: DEFAULT_LANGUAGE,
              targetLanguage: language,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const translatedTexts = data.translatedTexts || batch;
            
            console.log('[AutoTranslate] API Response:', { batch: batch.slice(0, 3), translatedTexts: translatedTexts.slice(0, 3) });
            
            let translatedCount = 0;
            batch.forEach((originalText, idx) => {
              const translated = translatedTexts[idx] || originalText;
              console.log(`[AutoTranslate] "${originalText}" -> "${translated}"`);
              
              if (translated && translated !== originalText && translated.length > 0) {
                const cacheKey = `${DEFAULT_LANGUAGE}_${language}_${originalText}`;
                TRANSLATION_CACHE.set(cacheKey, translated);
                
                // Trouver TOUS les nœuds avec ce texte dans le DOM (pas seulement ceux qu'on a stockés)
                const allNodes: Text[] = [];
                const walker = document.createTreeWalker(
                  containerRef.current!,
                  NodeFilter.SHOW_TEXT,
                  {
                    acceptNode: (node) => {
                      if (node.textContent?.trim() === originalText) {
                        return NodeFilter.FILTER_ACCEPT;
                      }
                      return NodeFilter.FILTER_REJECT;
                    },
                  }
                );
                
                let node;
                while ((node = walker.nextNode())) {
                  if (node instanceof Text && node.textContent?.trim() === originalText) {
                    allNodes.push(node);
                  }
                }
                
                // Appliquer la traduction à tous les nœuds trouvés
                allNodes.forEach(textNode => {
                  if (textNode.parentElement) {
                    textNode.textContent = translated;
                    TRANSLATED_NODES.set(textNode, { original: originalText, language });
                    translatedCount++;
                  }
                });
              }
            });
            console.log(`[AutoTranslate] Translated ${translatedCount} text nodes`);
          } else {
            console.error('[AutoTranslate] Translation API error:', response.status, await response.text());
          }
        } catch (error) {
          // Ignorer les erreurs silencieusement
        }
      }

      // Traduire aussi les placeholders et attributs
      const inputs = containerRef.current.querySelectorAll('input[placeholder], textarea[placeholder]');
      inputs.forEach(async (input) => {
        const htmlInput = input as HTMLInputElement | HTMLTextAreaElement;
        const placeholder = htmlInput.getAttribute('placeholder');
        if (placeholder && placeholder.trim().length > 0) {
          const cacheKey = `${DEFAULT_LANGUAGE}_${language}_${placeholder}`;
          if (TRANSLATION_CACHE.has(cacheKey)) {
            htmlInput.setAttribute('placeholder', TRANSLATION_CACHE.get(cacheKey)!);
          } else {
            try {
              const translated = await translate(placeholder, DEFAULT_LANGUAGE);
              if (translated && translated !== placeholder) {
                htmlInput.setAttribute('placeholder', translated);
                TRANSLATION_CACHE.set(cacheKey, translated);
              }
            } catch (error) {
              // Ignorer
            }
          }
        }
      });

      // Traduire les attributs title et aria-label
      const elementsWithTitle = containerRef.current.querySelectorAll('[title], [aria-label]');
      elementsWithTitle.forEach(async (element) => {
        const htmlElement = element as HTMLElement;
        const title = htmlElement.getAttribute('title');
        const ariaLabel = htmlElement.getAttribute('aria-label');
        
        if (title && title.trim().length > 0) {
          const cacheKey = `${DEFAULT_LANGUAGE}_${language}_${title}`;
          if (TRANSLATION_CACHE.has(cacheKey)) {
            htmlElement.setAttribute('title', TRANSLATION_CACHE.get(cacheKey)!);
          } else {
            try {
              const translated = await translate(title, DEFAULT_LANGUAGE);
              if (translated && translated !== title) {
                htmlElement.setAttribute('title', translated);
                TRANSLATION_CACHE.set(cacheKey, translated);
              }
            } catch (error) {
              // Ignorer
            }
          }
        }

        if (ariaLabel && ariaLabel.trim().length > 0) {
          const cacheKey = `${DEFAULT_LANGUAGE}_${language}_${ariaLabel}`;
          if (TRANSLATION_CACHE.has(cacheKey)) {
            htmlElement.setAttribute('aria-label', TRANSLATION_CACHE.get(cacheKey)!);
          } else {
            try {
              const translated = await translate(ariaLabel, DEFAULT_LANGUAGE);
              if (translated && translated !== ariaLabel) {
                htmlElement.setAttribute('aria-label', translated);
                TRANSLATION_CACHE.set(cacheKey, translated);
              }
            } catch (error) {
              // Ignorer
            }
          }
        }
      });

    } finally {
      isTranslatingRef.current = false;
    }
  }, [language, translate]);

  // Traduire quand la langue change (avec délai pour éviter trop d'appels)
  useEffect(() => {
    if (!containerRef.current) return;

    // Nettoyer le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Attendre un peu avant de traduire pour éviter trop d'appels simultanés
    timeoutRef.current = setTimeout(() => {
      translateTextNodes();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, translateTextNodes]);

  // Observer les changements dans le DOM
  useEffect(() => {
    if (!containerRef.current) return;

    // Détacher l'observateur précédent
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Créer un nouvel observateur avec debounce plus long pour éviter trop d'appels
    observerRef.current = new MutationObserver(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        translateTextNodes();
      }, 1000); // Debounce de 1 seconde pour éviter trop d'appels API
    });

    observerRef.current.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: false,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    // Traduire une seule fois après un délai pour laisser le DOM se charger
    setIsReady(true);
    
    // Attendre que le DOM soit prêt avant de traduire
    const timeout = setTimeout(() => {
      translateTextNodes();
    }, 500);
    
    return () => {
      clearTimeout(timeout);
    };

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [translateTextNodes]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
}
