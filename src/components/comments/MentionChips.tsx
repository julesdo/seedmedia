"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface MentionChipsProps {
  content: string;
  onRemoveMention: (username: string) => void;
  mentionedUsers?: Array<{
    _id: string;
    username?: string;
    name?: string;
    image?: string;
  }>;
}

/**
 * Affiche les mentions (@username) comme des chips supprimables au-dessus de l'input
 */
export function MentionChips({ content, onRemoveMention, mentionedUsers = [] }: MentionChipsProps) {
  // Extraire toutes les mentions du contenu
  const mentions = useMemo(() => {
    const mentionRegex = /@(\w+)/g;
    const matches: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      // Éviter les doublons
      if (!matches.includes(username)) {
        matches.push(username);
      }
    }

    return matches;
  }, [content]);

  if (mentions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mb-2 px-1">
      {mentions.map((username) => {
        // Trouver les infos utilisateur si disponibles
        const user = mentionedUsers.find((u) => u.username?.toLowerCase() === username.toLowerCase());

        return (
          <div
            key={username}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs"
          >
            {user?.image && (
              <Avatar className="size-4 shrink-0">
                <AvatarImage src={user.image} />
                <AvatarFallback className="text-[8px]">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="font-medium text-primary">@{username}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 rounded-full hover:bg-primary/20 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveMention(username);
              }}
            >
              <SolarIcon icon="close-circle-bold" className="size-3 text-primary/70" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

