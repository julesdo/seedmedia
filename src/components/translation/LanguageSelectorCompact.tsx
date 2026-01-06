"use client";

import React from "react";
import { useLocale } from 'next-intl';
import { useLocaleContext } from '@/contexts/LocaleContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

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

export function LanguageSelectorCompact({ 
  className,
  variant = "glass",
  size = "sm"
}: { 
  className?: string;
  variant?: "glass" | "ghost" | "outline";
  size?: "sm" | "default";
}) {
  const locale = useLocale();
  const { changeLocale } = useLocaleContext();
  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  const handleLocaleChange = async (newLocale: string) => {
    if (newLocale !== locale) {
      await changeLocale(newLocale);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className || "gap-1.5 hidden lg:flex"}>
          <span className="text-gradient-light">{currentLang.code.toUpperCase()}</span>
          <SolarIcon icon="alt-arrow-down-bold" className="h-3.5 w-3.5 icon-gradient-light" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.code;
          
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLocaleChange(lang.code)}
              className={cn(
                "cursor-pointer",
                isActive && "bg-accent/10 text-accent"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <span>{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
                {isActive && (
                  <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-accent" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
