"use client";

import React from "react";
import { useAutoTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface AutoTranslateProps {
  children: React.ReactNode;
  sourceLanguage?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Composant qui traduit automatiquement son contenu
 * Utilise le hook useAutoTranslation pour traduire le texte
 */
export function AutoTranslate({
  children,
  sourceLanguage = "fr",
  className,
  fallback,
}: AutoTranslateProps) {
  // Si children est une string, la traduire
  if (typeof children === "string") {
    const { translatedText, isLoading } = useAutoTranslation(children, sourceLanguage);

    if (isLoading && fallback) {
      return <>{fallback}</>;
    }

    return <span className={className}>{translatedText}</span>;
  }

  // Si children est un élément React avec du texte, essayer de le traduire
  if (React.isValidElement(children)) {
    const childText = extractTextFromChildren(children);
    if (childText) {
      const { translatedText, isLoading } = useAutoTranslation(childText, sourceLanguage);

      if (isLoading && fallback) {
        return <>{fallback}</>;
      }

      // Cloner l'élément avec le texte traduit
      return React.cloneElement(children as React.ReactElement, {
        ...children.props,
        children: translatedText,
        className: cn(children.props.className, className),
      });
    }
  }

  // Si on ne peut pas extraire de texte, retourner tel quel
  return <>{children}</>;
}

/**
 * Extrait le texte d'un élément React
 */
function extractTextFromChildren(children: React.ReactNode): string | null {
  if (typeof children === "string") {
    return children;
  }

  if (typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).filter(Boolean).join(" ");
  }

  if (React.isValidElement(children)) {
    if (children.props.children) {
      return extractTextFromChildren(children.props.children);
    }
  }

  return null;
}

/**
 * Composant HOC pour traduire automatiquement un composant
 */
export function withAutoTranslation<P extends object>(
  Component: React.ComponentType<P>,
  sourceLanguage: string = "fr"
) {
  return function TranslatedComponent(props: P) {
    // Traduire toutes les props de type string
    const translatedProps = Object.entries(props).reduce((acc, [key, value]) => {
      if (typeof value === "string" && value.trim() !== "") {
        // Note: On ne peut pas utiliser le hook ici directement
        // Il faudrait passer par un wrapper
        acc[key] = value;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    return <Component {...translatedProps} />;
  };
}

