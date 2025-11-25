"use client";

import { Icon, type IconProps } from "@iconify/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SolarIconProps extends Omit<IconProps, "icon"> {
  icon: string;
}

export function SolarIcon({ icon, className, ...props }: SolarIconProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  // Utiliser useLayoutEffect pour s'assurer que les classes sont appliquées
  useLayoutEffect(() => {
    if (containerRef.current) {
      // Utiliser l'API Iconify pour obtenir l'URL du SVG selon la doc
      const iconUrl = `https://api.iconify.design/solar:${icon}.svg`;
      const maskUrl = `url("${iconUrl}")`;
      
      // Vérifier si le span a la classe gradient (elle est appliquée directement)
      // Vérifier aussi dans className au cas où les classes ne sont pas encore dans classList
      const hasGradientClass = 
        containerRef.current.classList.contains('icon-gradient-light') || 
        containerRef.current.classList.contains('icon-gradient-active') ||
        containerRef.current.classList.contains('icon-gradient-accent') ||
        containerRef.current.classList.contains('icon-gradient-destructive') ||
        (className && (
          className.includes('icon-gradient-light') ||
          className.includes('icon-gradient-active') ||
          className.includes('icon-gradient-accent') ||
          className.includes('icon-gradient-destructive')
        ));
      
      if (hasGradientClass) {
        containerRef.current.style.setProperty('--icon-mask-url', maskUrl);
      }
    }
  }, [icon, className]);
  
  // Aussi vérifier après un court délai au cas où les classes sont ajoutées après le rendu
  useEffect(() => {
    if (containerRef.current) {
      const iconUrl = `https://api.iconify.design/solar:${icon}.svg`;
      const maskUrl = `url("${iconUrl}")`;
      
      const checkAndSet = () => {
        if (containerRef.current) {
          const hasGradientClass = 
            containerRef.current.classList.contains('icon-gradient-light') || 
            containerRef.current.classList.contains('icon-gradient-active') ||
            containerRef.current.classList.contains('icon-gradient-accent') ||
            containerRef.current.classList.contains('icon-gradient-destructive');
          
          if (hasGradientClass && !containerRef.current.style.getPropertyValue('--icon-mask-url')) {
            containerRef.current.style.setProperty('--icon-mask-url', maskUrl);
          }
        }
      };
      
      // Vérifier immédiatement
      checkAndSet();
      
      // Vérifier après un court délai
      const timeout = setTimeout(checkAndSet, 0);
      
      return () => clearTimeout(timeout);
    }
  }, [icon, className]);

  return (
    <span 
      ref={containerRef} 
      className={cn("inline-flex items-center justify-center", className)}
      style={{
        width: className?.includes('w-full') || className?.includes('w-') ? undefined : '1em',
        height: className?.includes('h-full') || className?.includes('h-') ? undefined : '1em',
      }}
    >
      <Icon 
        icon={`solar:${icon}`} 
        inline={true}
        mode="svg"
        className={cn(
          "w-full h-full",
          // Si h-full ou w-full est dans className, l'icône doit s'adapter
          className?.includes('h-full') || className?.includes('w-full') 
            ? "w-full h-full" 
            : undefined
        )}
        style={{
          width: className?.includes('w-full') ? '100%' : undefined,
          height: className?.includes('h-full') ? '100%' : undefined,
        }}
        {...props} 
      />
    </span>
  );
}
