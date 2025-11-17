"use client";

import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useNetworkSpeed, getImageQuality } from "@/hooks/useNetworkSpeed";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null; // URL ou storageId
  storageId?: Id<"_storage"> | null; // StorageId Convex optionnel
  alt: string;
  quality?: "low" | "medium" | "high" | "original" | "auto"; // Auto utilise useNetworkSpeed
  placeholder?: "blur" | "empty" | string; // Blur placeholder ou couleur
  className?: string;
  aspectRatio?: number; // Ratio d'aspect pour éviter le layout shift
  sizes?: string; // Pour responsive images
  priority?: boolean; // Charger immédiatement sans lazy loading
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Composant d'image optimisé avec :
 * - Détection automatique de la bande passante
 * - Chargement progressif avec placeholder
 * - Support Convex Storage avec URLs signées
 * - Lazy loading par défaut
 * - Responsive images
 */
export function OptimizedImage({
  src,
  storageId,
  alt,
  quality = "auto",
  placeholder = "blur",
  className,
  aspectRatio,
  sizes,
  priority = false,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  const networkInfo = useNetworkSpeed();
  const imageQuality = quality === "auto" ? getImageQuality(networkInfo) : quality;

  // Détecter si src est un storageId Convex (si storageId n'est pas fourni)
  const detectedStorageId = storageId || 
    (src && !src.startsWith("http") && /^[a-z0-9]{20,}$/.test(src) 
      ? (src as Id<"_storage">) 
      : null);

  // Récupérer l'URL si c'est un storageId Convex
  const storageFileUrl = useQuery(
    api.storage.getFileUrl,
    detectedStorageId ? { storageId: detectedStorageId } : "skip"
  );

  // Déterminer l'URL de l'image
  useEffect(() => {
    let finalUrl: string | null = null;

    // Si on a un storageId explicite ou détecté et son URL
    if (detectedStorageId && storageFileUrl) {
      finalUrl = storageFileUrl;
    } else if (src) {
      // Si c'est une URL complète, l'utiliser directement
      if (src.startsWith("http://") || src.startsWith("https://")) {
        finalUrl = src;
      } else if (detectedStorageId && storageFileUrl) {
        // Si src est un storageId et qu'on a l'URL
        finalUrl = storageFileUrl;
      } else {
        // Sinon, utiliser src tel quel (pourrait être un chemin relatif)
        finalUrl = src;
      }
    }

    setImageUrl(finalUrl);
    if (priority && finalUrl && !imageSrc) {
      setImageSrc(finalUrl);
    }
    setIsLoading(!!finalUrl && !imageSrc);
    setHasError(false);
  }, [src, detectedStorageId, storageFileUrl, priority, imageSrc]);

  // Charger l'image
  const handleLoad = () => {
    setIsLoading(false);
    setShowPlaceholder(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setShowPlaceholder(false);
    onError?.();
  };

  // Charger immédiatement si priority
  useEffect(() => {
    if (priority && imageUrl && !imageSrc) {
      setImageSrc(imageUrl);
    }
  }, [priority, imageUrl, imageSrc]);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (priority || !imageUrl || imageSrc) return;

    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !imageSrc) {
            // Charger l'image quand elle devient visible
            setImageSrc(imageUrl);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Commencer à charger 50px avant que l'image soit visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [imageUrl, imageSrc, priority]);

  // Si pas d'URL, afficher un placeholder
  if (!imageUrl && !imageSrc && !hasError) {
    return (
      <div
        className={cn(
          "bg-muted/30 animate-pulse flex items-center justify-center",
          className
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
        {...props}
      >
        {placeholder === "empty" ? null : (
          <div className="w-12 h-12 rounded-full bg-muted" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)} style={aspectRatio ? { aspectRatio } : undefined}>
      {/* Placeholder blur/loading */}
      {showPlaceholder && (isLoading || !imageSrc) && (
        <div
          className={cn(
            "absolute inset-0 bg-muted/30 animate-pulse flex items-center justify-center",
            placeholder === "empty" && "bg-transparent"
          )}
        >
          {placeholder === "blur" && !placeholder.startsWith("#") && (
            <div className="w-12 h-12 rounded-full bg-muted" />
          )}
        </div>
      )}

      {/* Image */}
      {(imageSrc || (priority && imageUrl)) && (
        <img
          ref={imgRef}
          src={priority ? (imageUrl || imageSrc || undefined) : (imageSrc || undefined)}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading || showPlaceholder ? "opacity-0" : "opacity-100",
            className
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Erreur */}
      {hasError && (
        <div className="absolute inset-0 bg-muted/30 flex items-center justify-center">
          <div className="text-xs text-muted-foreground opacity-50">Image</div>
        </div>
      )}
    </div>
  );
}

