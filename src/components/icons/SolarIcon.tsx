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

  // Vérifier si une taille est spécifiée dans className
  const hasSizeClass = className?.includes('size-') || 
                       className?.includes('w-') || 
                       className?.includes('h-') || 
                       className?.includes('w-full') || 
                       className?.includes('h-full');

  return (
    <span 
      ref={containerRef} 
      className={cn("inline-flex items-center justify-center", className)}
      style={hasSizeClass ? undefined : {
        width: '1em',
        height: '1em',
      }}
    >
      <Icon 
        icon={`solar:${icon}`} 
        inline={true}
        mode="svg"
        className="w-full h-full"
        {...props} 
      />
    </span>
  );
}
