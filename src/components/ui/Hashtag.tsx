"use client";

import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";

interface HashtagProps {
  tag: string;
  href?: string;
  className?: string;
  variant?: "default" | "subtle" | "accent";
  size?: "sm" | "md" | "lg";
}

/**
 * Composant Hashtag réutilisable pour afficher des hashtags cliquables
 * Utilisé partout dans l'app pour les tags d'organisations, articles, projets, etc.
 * 
 * @param tag - Le texte du hashtag (sans le #)
 * @param href - L'URL vers la page du hashtag (par défaut: /hashtags/[tag])
 * @param className - Classes CSS supplémentaires
 * @param variant - Style du hashtag (default, subtle, accent)
 * @param size - Taille du hashtag (sm, md, lg)
 */
export function Hashtag({ 
  tag, 
  href, 
  className,
  variant = "default",
  size = "md"
}: HashtagProps) {
  const tagLower = tag.toLowerCase().trim();
  const finalHref = href || `/hashtags/${encodeURIComponent(tagLower)}`;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-xs sm:text-sm",
    lg: "text-sm sm:text-base",
  };

  const variantClasses = {
    default: "text-primary hover:text-primary/80",
    subtle: "text-muted-foreground hover:text-primary",
    accent: "text-accent hover:text-accent/80",
  };

  return (
    <Link
      href={finalHref}
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors group",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span className={cn(
        "transition-colors",
        variant === "default" && "text-muted-foreground/60 group-hover:text-primary/60",
        variant === "subtle" && "text-muted-foreground/40 group-hover:text-primary/60",
        variant === "accent" && "text-accent/60 group-hover:text-accent/80"
      )}>
        #
      </span>
      <span>{tag}</span>
    </Link>
  );
}

/**
 * Composant pour afficher une liste de hashtags
 */
interface HashtagListProps {
  tags: string[];
  href?: (tag: string) => string;
  className?: string;
  variant?: "default" | "subtle" | "accent";
  size?: "sm" | "md" | "lg";
  maxVisible?: number;
  showMore?: boolean;
}

export function HashtagList({ 
  tags, 
  href,
  className,
  variant = "default",
  size = "md",
  maxVisible,
  showMore = false
}: HashtagListProps) {
  if (!tags || tags.length === 0) return null;

  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const remainingCount = maxVisible ? tags.length - maxVisible : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visibleTags.map((tag) => (
        <Hashtag
          key={tag}
          tag={tag}
          href={href ? href(tag) : undefined}
          variant={variant}
          size={size}
        />
      ))}
      {showMore && remainingCount > 0 && (
        <span className="text-xs text-muted-foreground/60">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

