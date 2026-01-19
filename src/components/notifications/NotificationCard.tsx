"use client";

import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface NotificationCardProps {
  id: Id<"notifications">;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: number;
  iconUrl?: string;
  appName?: string;
  onClick?: () => void;
}

/**
 * Composant de notification push style iOS/Android
 */
export function NotificationCard({
  id,
  type,
  title,
  message,
  link,
  read,
  createdAt,
  iconUrl,
  appName = "Seed",
  onClick,
}: NotificationCardProps) {
  // Déterminer l'icône selon le type
  const getIcon = () => {
    if (iconUrl) {
      return (
        <img
          src={iconUrl}
          alt={appName}
          className="size-12 rounded-xl object-cover shrink-0"
        />
      );
    }

    // Icônes par défaut selon le type
    const iconMap: Record<string, string> = {
      article_approved: "document-check-bold",
      article_rejected: "document-remove-bold",
      comment: "chat-round-bold",
      comment_reply: "chat-round-call-bold",
      proposal_vote: "vote-bold",
      level_up: "star-bold",
      seeds_earned: "leaf-bold",
    };

    const icon = iconMap[type] || "bell-bold";
    return (
      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <SolarIcon icon={icon} className="size-6 text-primary" />
      </div>
    );
  };

  // Déterminer la couleur de l'indicateur selon le type
  const getIndicatorColor = () => {
    const colorMap: Record<string, string> = {
      article_approved: "bg-green-500",
      article_rejected: "bg-red-500",
      comment: "bg-blue-500",
      comment_reply: "bg-blue-500",
      proposal_vote: "bg-purple-500",
      level_up: "bg-yellow-500",
      seeds_earned: "bg-primary",
    };
    return colorMap[type] || "bg-primary";
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/50",
        "hover:bg-card/80 transition-colors",
        !read && "bg-card/90 border-primary/20"
      )}
    >
      {/* Icône de l'app */}
      <div className="relative shrink-0">
        {getIcon()}
        {/* Indicateur de couleur */}
        <div
          className={cn(
            "absolute -top-1 -right-1 size-3 rounded-full border-2 border-background",
            getIndicatorColor()
          )}
        />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {/* En-tête avec nom de l'app et timestamp */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {appName}
            </span>
            {!read && (
              <div className="size-1.5 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {formatDistanceToNow(createdAt, {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>

        {/* Titre */}
        <h3
          className={cn(
            "text-sm font-semibold mb-1 line-clamp-1",
            !read && "text-foreground",
            read && "text-muted-foreground"
          )}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          className={cn(
            "text-sm line-clamp-2",
            !read ? "text-foreground/90" : "text-muted-foreground"
          )}
        >
          {message}
        </p>
      </div>
    </motion.div>
  );

  if (link) {
    return (
      <Link href={link} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className="cursor-pointer">
      {content}
    </div>
  );
}

