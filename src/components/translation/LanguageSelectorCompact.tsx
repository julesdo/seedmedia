"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { language, setLanguage } = useLanguage();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

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
                  const isFrench = lang.code === "fr";
                  const isDisabled = !isFrench;
                  
                  return (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => {
                        if (!isDisabled) {
                          setLanguage(lang.code as any);
                        }
                      }}
                      disabled={isDisabled}
                      className={cn(
                        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                        language === lang.code && "bg-accent/10 text-accent"
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span>{lang.flag}</span>
                        <span className="flex-1">{lang.label}</span>
                        {language === lang.code && (
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

