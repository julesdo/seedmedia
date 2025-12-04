"use client";

import React, { ReactNode, Children, isValidElement, cloneElement } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAutoTranslation } from "@/hooks/useTranslation";
import { TranslatedText } from "./TranslatedText";

const DEFAULT_LANGUAGE = "fr";

/**
 * Composant qui traduit automatiquement tous les textes enfants
 * 
 * Usage:
 * <AutoTranslateWrapper>
 *   <p>Bonjour</p>
 *   <h1>Bienvenue</h1>
 * </AutoTranslateWrapper>
 */
export function AutoTranslateWrapper({ 
  children, 
  sourceLanguage = DEFAULT_LANGUAGE 
}: { 
  children: ReactNode;
  sourceLanguage?: string;
}) {
  const { language } = useLanguage();
  
  // Si la langue est la même que la source, pas besoin de traduire
  if (language === sourceLanguage || language === DEFAULT_LANGUAGE) {
    return <>{children}</>;
  }

  // Traduire récursivement les enfants
  const translateChildren = (node: ReactNode): ReactNode => {
    if (typeof node === "string") {
      // Si c'est une string, la traduire
      return <TranslatedText text={node} sourceLanguage={sourceLanguage} />;
    }

    if (typeof node === "number") {
      return String(node);
    }

    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>{translateChildren(child)}</React.Fragment>
      ));
    }

    if (isValidElement(node)) {
      // Si l'élément a des enfants, les traduire
      if (node.props.children) {
        return cloneElement(node, {
          ...node.props,
          children: translateChildren(node.props.children),
        } as any);
      }
      return node;
    }

    return node;
  };

  return <>{translateChildren(children)}</>;
}

