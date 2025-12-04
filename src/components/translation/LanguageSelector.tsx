"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SolarIcon } from "@/components/icons/SolarIcon";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
] as const;

export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{currentLang.flag}</span>
            <span className="hidden sm:inline">{currentLang.label}</span>
            <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

