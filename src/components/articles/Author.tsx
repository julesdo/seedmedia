"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AuthorProps {
  author: {
    _id: string;
    name: string;
    image?: string | null;
    email?: string;
    credibilityScore?: number;
  } | null;
  showDate?: boolean;
  date?: number | Date;
  showCredibility?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "detailed" | "hero";
  className?: string;
  linkToProfile?: boolean;
  textColor?: "default" | "white" | "muted";
}

export function Author({
  author,
  showDate = false,
  date,
  showCredibility = false,
  size = "md",
  variant = "default",
  className,
  linkToProfile = true,
  textColor = "default",
}: AuthorProps) {
  if (!author) {
    return null;
  }

  const sizeClasses = {
    sm: {
      avatar: "h-5 w-5",
      text: "text-xs",
      fallback: "text-[10px]",
    },
    md: {
      avatar: "h-8 w-8",
      text: "text-sm",
      fallback: "text-xs",
    },
    lg: {
      avatar: "h-10 w-10",
      text: "text-base",
      fallback: "text-sm",
    },
  };

  const textColorClasses = {
    default: "text-foreground",
    white: "text-white",
    muted: "text-muted-foreground",
  };

  const initials = author.name?.[0]?.toUpperCase() || author.email?.[0]?.toUpperCase() || "?";

  const avatarElement = (
    <Avatar className={cn(sizeClasses[size].avatar, variant === "hero" && "ring-2 ring-white/30")}>
      <AvatarImage src={author.image || undefined} alt={author.name} />
      <AvatarFallback className={cn(
        sizeClasses[size].fallback,
        variant === "hero" && "bg-white/20 text-white"
      )}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  const nameElement = (
    <span className={cn("font-medium", sizeClasses[size].text, textColorClasses[textColor])}>
      {author.name}
    </span>
  );

  const content = (
    <div className="flex items-center gap-2">
      {linkToProfile ? (
        <Link href={`/users/${author._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {avatarElement}
          {variant !== "compact" && nameElement}
        </Link>
      ) : (
        <>
          {avatarElement}
          {variant !== "compact" && nameElement}
        </>
      )}
      
      {variant === "detailed" && (
        <>
          {showCredibility && author.credibilityScore !== undefined && (
            <Badge variant="secondary" className="text-xs">
              <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
              {author.credibilityScore}
            </Badge>
          )}
          {showDate && date && (
            <span className={cn("text-muted-foreground", sizeClasses[size].text)}>
              {formatDistanceToNow(typeof date === "number" ? new Date(date) : date, {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (variant === "hero") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {linkToProfile ? (
          <Link href={`/users/${author._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {avatarElement}
            <div>
              {nameElement}
              {showDate && date && (
                <p className={cn("text-xs", textColor === "white" ? "text-white/80" : "text-muted-foreground")}>
                  {formatDistanceToNow(typeof date === "number" ? new Date(date) : date, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <>
            {avatarElement}
            <div>
              {nameElement}
              {showDate && date && (
                <p className={cn("text-xs", textColor === "white" ? "text-white/80" : "text-muted-foreground")}>
                  {formatDistanceToNow(typeof date === "number" ? new Date(date) : date, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {linkToProfile ? (
          <Link href={`/users/${author._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {avatarElement}
            {nameElement}
          </Link>
        ) : (
          <>
            {avatarElement}
            {nameElement}
          </>
        )}
      </div>
    );
  }

  if (variant === "default") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {linkToProfile ? (
          <Link href={`/users/${author._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {avatarElement}
            {nameElement}
            {showDate && date && (
              <>
                <span className={cn(textColor === "white" ? "text-white/60" : "text-muted-foreground")}>•</span>
                <span className={cn(
                  textColor === "white" ? "text-white/80" : "text-muted-foreground",
                  sizeClasses[size].text
                )}>
                  {formatDistanceToNow(typeof date === "number" ? new Date(date) : date, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </>
            )}
          </Link>
        ) : (
          <>
            {avatarElement}
            {nameElement}
            {showDate && date && (
              <>
                <span className={cn(textColor === "white" ? "text-white/60" : "text-muted-foreground")}>•</span>
                <span className={cn(
                  textColor === "white" ? "text-white/80" : "text-muted-foreground",
                  sizeClasses[size].text
                )}>
                  {formatDistanceToNow(typeof date === "number" ? new Date(date) : date, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  return content;
}

