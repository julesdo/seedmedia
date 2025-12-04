"use client";

import React from "react";
import { useAutoTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TranslatedTextProps {
  text: string;
  sourceLanguage?: string;
  className?: string;
  showSkeleton?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Composant simple pour afficher du texte traduit
 * 
 * Usage:
 * <TranslatedText text="Bonjour" />
 * <TranslatedText text="Bienvenue" as="h1" className="text-2xl" />
 */
export function TranslatedText({
  text,
  sourceLanguage = "fr",
  className,
  showSkeleton = false,
  as: Component = "span",
}: TranslatedTextProps) {
  const { translatedText, isLoading } = useAutoTranslation(text, sourceLanguage);

  if (isLoading && showSkeleton) {
    return <Skeleton className={cn("inline-block h-4 w-20", className)} />;
  }

  return <Component className={className}>{translatedText}</Component>;
}
