"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { useAutoTranslation } from "@/hooks/useTranslation";
import { InputProps } from "@/components/ui/input";

const DEFAULT_LANGUAGE = "fr";

/**
 * Composant Input qui traduit automatiquement le placeholder
 */
export function TranslatedInput({ 
  placeholder,
  sourceLanguage = DEFAULT_LANGUAGE,
  ...props 
}: InputProps & { sourceLanguage?: string }) {
  const { translatedText: translatedPlaceholder, isLoading } = useAutoTranslation(
    placeholder || "",
    sourceLanguage
  );

  return (
    <Input
      {...props}
      placeholder={isLoading ? placeholder : translatedPlaceholder}
    />
  );
}

