"use client";

import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { Textarea } from "@/components/ui/textarea";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onMentionInserted?: (user: { _id: Id<"users">; username?: string; name?: string; image?: string }) => void;
  mentionedUsers?: Array<{
    _id: string;
    username?: string;
    name?: string;
    image?: string;
  }>;
  className?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

/**
 * Input personnalisé qui affiche les mentions comme des chips directement dans le texte
 * Utilise un textarea invisible pour la saisie et un overlay pour afficher les chips
 */
export function MentionInput({
  value,
  onChange,
  placeholder = "Ajouter un commentaire...",
  onKeyDown,
  onMentionInserted,
  mentionedUsers = [],
  className,
  inputRef,
}: MentionInputProps) {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalTextareaRef;
  const overlayRef = useRef<HTMLDivElement>(null);

  // Parser le contenu pour créer les chips
  const renderMentionChips = () => {
    if (!value) return null;

    const chips: Array<{ username: string; startIndex: number; endIndex: number; user?: any }> = [];
    const mentionRegex = /@(\w+)/g;
    let match;

    while ((match = mentionRegex.exec(value)) !== null) {
      const username = match[1];
      const user = mentionedUsers.find(
        (u) => u.username?.toLowerCase() === username.toLowerCase()
      );
      chips.push({
        username,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        user,
      });
    }

    return chips;
  };

  // Calculer la position des chips en fonction de la position du texte
  const getChipPosition = (startIndex: number) => {
    if (!textareaRef.current) return { top: 0, left: 0 };

    // Créer un élément temporaire pour mesurer
    const measureDiv = document.createElement("div");
    measureDiv.style.position = "absolute";
    measureDiv.style.visibility = "hidden";
    measureDiv.style.whiteSpace = "pre-wrap";
    measureDiv.style.font = window.getComputedStyle(textareaRef.current).font;
    measureDiv.style.padding = window.getComputedStyle(textareaRef.current).padding;
    measureDiv.style.width = `${textareaRef.current.offsetWidth}px`;
    measureDiv.textContent = value.substring(0, startIndex);
    document.body.appendChild(measureDiv);

    const rect = textareaRef.current.getBoundingClientRect();
    const textBefore = value.substring(0, startIndex);
    const lines = textBefore.split("\n");
    const lineHeight = parseFloat(window.getComputedStyle(textareaRef.current).lineHeight) || 20;
    
    const top = (lines.length - 1) * lineHeight + 12; // 12px pour le padding
    const left = measureDiv.offsetWidth % textareaRef.current.offsetWidth;

    document.body.removeChild(measureDiv);

    return { top, left };
  };

  const chips = renderMentionChips();

  // Synchroniser le scroll et la taille
  useEffect(() => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    
    if (!textarea || !overlay) return;

    const syncScroll = () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    };

    const syncSize = () => {
      overlay.style.height = `${textarea.scrollHeight}px`;
      overlay.style.minHeight = `${textarea.offsetHeight}px`;
    };

    syncSize();
    syncScroll();

    textarea.addEventListener("scroll", syncScroll);
    textarea.addEventListener("input", syncSize);
    
    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(textarea);

    return () => {
      textarea.removeEventListener("scroll", syncScroll);
      textarea.removeEventListener("input", syncSize);
      resizeObserver.disconnect();
    };
  }, [value]);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Fond avec le style */}
      <div className="absolute inset-0 rounded-2xl bg-muted/50 pointer-events-none" />
      
      {/* Textarea invisible pour la saisie */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        className="resize-none w-full text-sm min-h-[44px] max-h-32 rounded-2xl px-4 py-3 pr-20 border-0 focus-visible:ring-1 focus-visible:ring-ring relative z-10"
        rows={1}
        style={{ 
          color: "transparent",
          caretColor: "hsl(var(--foreground))",
          background: "transparent",
        }}
      />
      
      {/* Overlay pour afficher le texte formaté avec chips */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none overflow-auto rounded-2xl"
        style={{
          paddingTop: "0.75rem",
          paddingBottom: "0.75rem",
          paddingLeft: "1rem",
          paddingRight: "5rem",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          zIndex: 1,
        }}
      >
        <div 
          className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed"
        >
          {!value && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {value && value.split(/(@\w+)/g).map((part, index) => {
            if (part.startsWith("@")) {
              const username = part.substring(1);
              const chip = chips?.find((c) => c.username === username);
              if (chip) {
                return (
                  <span 
                    key={`chip-${index}-${chip.startIndex}`} 
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mx-0.5 pointer-events-auto"
                  >
                    {chip.user?.image && (
                      <Avatar className="size-3 shrink-0">
                        <AvatarImage src={chip.user.image} />
                        <AvatarFallback className="text-[6px]">
                          {chip.user.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span>@{username}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = value.replace(new RegExp(`@${username}\\s?`, "g"), "");
                        onChange(newValue);
                        setTimeout(() => {
                          textareaRef.current?.focus();
                        }, 0);
                      }}
                      className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <SolarIcon icon="close-circle-bold" className="size-2.5 text-primary/70" />
                    </button>
                  </span>
                );
              }
            }
            return <span key={`text-${index}`}>{part}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

