"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const DOC_SECTIONS = [
  {
    title: "Introduction",
    items: [
      {
        label: "Accueil",
        href: "/documentation",
        icon: "home-2-bold",
      },
      {
        label: "Démarrer",
        href: "/documentation/getting-started",
        icon: "rocket-2-bold",
      },
    ],
  },
  {
    title: "Fonctionnalités",
    items: [
      {
        label: "Vue d'ensemble",
        href: "/documentation/features",
        icon: "widget-bold",
      },
      {
        label: "Articles",
        href: "/documentation/features/articles",
        icon: "document-text-bold",
      },
      {
        label: "Gouvernance",
        href: "/documentation/features/governance",
        icon: "settings-bold",
      },
      {
        label: "Débats",
        href: "/documentation/features/debates",
        icon: "chat-round-bold",
      },
      {
        label: "Actions",
        href: "/documentation/features/actions",
        icon: "hand-stars-bold",
      },
      {
        label: "Projets",
        href: "/documentation/features/projects",
        icon: "rocket-2-bold",
      },
      {
        label: "Crédibilité",
        href: "/documentation/features/credibility",
        icon: "star-bold",
      },
    ],
  },
  {
    title: "Développement",
    items: [
      {
        label: "Installation",
        href: "/documentation/development",
        icon: "code-bold",
      },
      {
        label: "Guide de l'éditeur",
        href: "/documentation/development/editor",
        icon: "code-2-bold",
      },
      {
        label: "Architecture",
        href: "/documentation/development/architecture",
        icon: "layers-bold",
      },
      {
        label: "API",
        href: "/documentation/development/api",
        icon: "database-bold",
      },
    ],
  },
  {
    title: "Contribuer",
    items: [
      {
        label: "Guide de contribution",
        href: "/documentation/contributing",
        icon: "heart-bold",
      },
      {
        label: "Code de conduite",
        href: "/documentation/contributing/code-of-conduct",
        icon: "shield-check-bold",
      },
    ],
  },
  {
    title: "Légal",
    items: [
      {
        label: "Licence",
        href: "/documentation/licence",
        icon: "shield-check-bold",
      },
    ],
  },
];

export function DocSidebar() {
  const pathname = usePathname();

  // Collecter tous les items avec leurs hrefs pour trouver le match le plus spécifique
  const allItems = DOC_SECTIONS.flatMap((section) => section.items);
  
  // Trouver l'item le plus spécifique qui correspond au pathname
  const getActiveItem = () => {
    if (!pathname) return null;
    
    // Trier par longueur de route (du plus long au plus court) pour prioriser les routes les plus spécifiques
    const sortedItems = [...allItems].sort((a, b) => {
      const aLength = a.href.split("/").filter(Boolean).length;
      const bLength = b.href.split("/").filter(Boolean).length;
      return bLength - aLength; // Plus long en premier
    });

    // Trouver la route la plus spécifique qui correspond
    for (const item of sortedItems) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.href;
      }
    }
    
    return null;
  };

  const activeHref = getActiveItem();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-border/60 bg-background/95 px-0 pb-4 pt-4 shadow-none backdrop-blur lg:flex">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/95 px-5 pb-3 pt-1 backdrop-blur">
        <Link href="/documentation" className="flex items-center gap-2">
          <SolarIcon icon="document-text-bold" className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Documentation</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-5 scrollbar-thin">
          <nav className="space-y-6">
            {DOC_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = activeHref === item.href;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <SolarIcon
                            icon={item.icon}
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

