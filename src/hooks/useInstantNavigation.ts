"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useEffect } from "react";

/**
 * Hook pour navigation instantanée avec feedback visuel
 * 
 * Utilise startTransition pour rendre la navigation non-bloquante
 * et affiche immédiatement un feedback visuel
 */
export function useInstantNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (href: string) => {
    // Précharger la page avant de naviguer
    router.prefetch(href);
    
    // Naviguer de manière non-bloquante
    startTransition(() => {
      router.push(href);
    });
  };

  return { navigate, isPending };
}

/**
 * Hook pour précharger les liens visibles dans le viewport
 * 
 * Utilise Intersection Observer pour précharger automatiquement
 * les pages des liens visibles
 */
export function usePrefetchVisibleLinks() {
  const router = useRouter();

  useEffect(() => {
    // Trouver tous les liens avec data-prefetch="viewport"
    const links = document.querySelectorAll<HTMLAnchorElement>(
      'a[data-prefetch="viewport"]'
    );

    if (links.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute("href");
            if (href && !link.dataset.prefetched) {
              // Précharger la page
              router.prefetch(href);
              link.dataset.prefetched = "true";
            }
          }
        });
      },
      {
        rootMargin: "200px", // Précharger 200px avant que le lien soit visible
        threshold: 0.1,
      }
    );

    links.forEach((link) => {
      observer.observe(link);
    });

    return () => {
      observer.disconnect();
    };
  }, [router]);
}

