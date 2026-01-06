"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateBotAvatarDataUriSync } from "@/lib/bot-avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface BotAvatarProps {
  name: string;
  seed?: string;
  avatar?: string | null;
  color?: string;
  category?: string;
  size?: number;
  className?: string;
}

const categoryIcons: Record<string, string> = {
  detection: "radar-2-bold",
  generation: "magic-stick-3-bold",
  resolution: "check-circle-bold",
  tracking: "chart-2-bold",
  aggregation: "news-bold",
  other: "settings-bold",
};

export function BotAvatar({
  name,
  seed,
  avatar,
  color,
  category,
  size = 48,
  className,
}: BotAvatarProps) {
  // Générer l'avatar data URI à la volée si pas d'avatar fourni
  const avatarDataUri = useMemo(() => {
    if (avatar) return avatar;
    // Générer l'avatar avec DiceBear
    // Nettoyer la couleur (enlever le # si présent)
    const cleanColor = color ? color.replace('#', '') : undefined;
    return generateBotAvatarDataUriSync(seed || name, {
      backgroundColor: cleanColor ? [cleanColor] : undefined,
    });
  }, [name, seed, avatar, color]);

  return (
    <Avatar
      className={cn("shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color || undefined,
      }}
    >
      {avatarDataUri ? (
        <AvatarImage src={avatarDataUri} alt={name} />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary">
        <SolarIcon
          icon={category ? categoryIcons[category] || "robot-bold" : "robot-bold"}
          className="size-6"
        />
      </AvatarFallback>
    </Avatar>
  );
}

