"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserProfileCard } from "@/components/layout/UserProfileCard";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const studioNavSections: NavSection[] = [
  // Dashboard Home
  {
    items: [
      {
        title: "Dashboard",
        href: "/studio",
        icon: "home-bold",
      },
    ],
  },
  // Créer - Actions rapides de création
  {
    title: "Créer",
    items: [
      {
        title: "Nouvel article",
        href: "/studio/articles/nouveau",
        icon: "pen-new-round-bold",
      },
      {
        title: "Nouveau projet",
        href: "/studio/projets/nouveau",
        icon: "add-circle-bold",
      },
      {
        title: "Nouvelle action",
        href: "/studio/actions/nouvelle",
        icon: "add-circle-bold",
      },
      {
        title: "Nouveau débat",
        href: "/studio/debats/nouveau",
        icon: "add-circle-bold",
      },
    ],
  },
  // Mes contenus - Gestion de tous les contenus créés
  {
    title: "Mes contenus",
    items: [
      {
        title: "Articles",
        href: "/studio/articles",
        icon: "document-bold",
      },
      {
        title: "Projets",
        href: "/studio/projets",
        icon: "folder-bold",
      },
      {
        title: "Actions",
        href: "/studio/actions",
        icon: "hand-stars-bold",
      },
      {
        title: "Débats",
        href: "/studio/debats",
        icon: "question-circle-bold",
      },
    ],
  },
  // Modération - Workflows de modération et validation
  {
    title: "Modération",
    items: [
      {
        title: "Fact-check",
        href: "/studio/fact-check",
        icon: "verified-check-bold",
      },
      {
        title: "Articles en attente",
        href: "/studio/articles/en-attente",
        icon: "clock-circle-bold",
      },
    ],
  },
  // Gouvernance - Décisions collectives et règles
  {
    title: "Gouvernance",
    items: [
      {
        title: "Votes & propositions",
        href: "/studio/gouvernance",
        icon: "hand-stars-bold",
      },
      {
        title: "Catégories",
        href: "/studio/gouvernance/categories",
        icon: "tag-bold",
      },
      {
        title: "Évolutions",
        href: "/studio/gouvernance/evolutions",
        icon: "settings-bold",
      },
      {
        title: "Règles",
        href: "/studio/gouvernance/regles",
        icon: "list-check-bold",
      },
    ],
  },
  // Profil - Profil public et informations personnelles
  {
    title: "Profil",
    items: [
      {
        title: "Mon profil",
        href: "/studio/profile",
        icon: "user-bold",
      },
      {
        title: "Crédibilité",
        href: "/studio/credibilite",
        icon: "star-bold",
      },
      {
        title: "Favoris",
        href: "/studio/favoris",
        icon: "star-bold",
      },
      {
        title: "Missions",
        href: "/studio/missions",
        icon: "rocket-bold",
      },
    ],
  },
  // Compte - Gestion du compte et paramètres
  {
    title: "Compte",
    items: [
      {
        title: "Comptes",
        href: "/studio/accounts",
        icon: "user-id-bold",
      },
      {
        title: "Organisations",
        href: "/studio/organizations",
        icon: "buildings-bold",
      },
      {
        title: "Invitations",
        href: "/studio/invitations",
        icon: "mailbox-bold",
      },
      {
        title: "Paramètres",
        href: "/studio/settings",
        icon: "settings-bold",
      },
    ],
  },
  // Autres - Features avancées et expérimentales
  {
    title: "Autres",
    items: [
      {
        title: "Statistiques",
        href: "/studio/stats",
        icon: "chart-2-bold",
      },
      {
        title: "Labs",
        href: "/studio/labs",
        icon: "test-tube-bold",
      },
    ],
  },
];

export function StudioSidebar() {
  const pathname = usePathname();
  const user = useQuery(api.auth.getCurrentUser);
  const accounts = useQuery(api.accounts.getUserAccounts);

  return (
    <Sidebar className="w-[18rem] border-r border-sidebar-border/50 backdrop-blur-[18px] bg-card">
      <SidebarHeader className="px-[18px] h-16 flex border-b border-sidebar-border/50">
        <Link href="/studio" className="flex items-center gap-2 group">
          <Image
            src="/logo.svg"
            alt="Seed Studio"
            width={91}
            height={37}
            className="h-10 w-auto transition-opacity group-hover:opacity-90"
          />
          <span className="text-xs font-medium text-muted-foreground">Studio</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-[18px] pt-6">
        {(() => {
          // Collecter tous les items de navigation avec leurs sections
          const allItems: Array<{ item: NavItem; sectionIndex: number }> = [];
          studioNavSections.forEach((section, sectionIndex) => {
            section.items.forEach((item) => {
              // Filtrer les items selon le rôle (pour "Articles en attente")
              if (item.href === "/studio/articles/en-attente" && user?.role !== "editeur") {
                return;
              }
              allItems.push({ item, sectionIndex });
            });
          });

          // Trier par longueur de route (du plus long au plus court) pour prioriser les routes les plus spécifiques
          allItems.sort((a, b) => {
            const aLength = a.item.href.split("/").filter(Boolean).length;
            const bLength = b.item.href.split("/").filter(Boolean).length;
            return bLength - aLength; // Plus long en premier
          });

          // Trouver la route la plus spécifique qui correspond
          const pathSegments = pathname.split("/").filter(Boolean);
          let activeItemHref: string | null = null;

          for (const { item } of allItems) {
            const itemSegments = item.href.split("/").filter(Boolean);
            
            // Vérifier si la route correspond
            if (
              pathSegments.length >= itemSegments.length &&
              itemSegments.every((segment, index) => segment === pathSegments[index])
            ) {
              activeItemHref = item.href;
              break; // Prendre la première (la plus spécifique)
            }
          }

          // Rendre les sections avec leurs items
          return studioNavSections.map((section, sectionIndex) => (
            <SidebarGroup key={sectionIndex} className="space-y-3">
              {section.title && (
                <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-[0.03em] opacity-50">
                  <span className="text-gradient-light">{section.title}</span>
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {section.items.map((item) => {
                    // Filtrer les items selon le rôle (pour "Articles en attente")
                    if (item.href === "/studio/articles/en-attente" && user?.role !== "editeur") {
                      return null;
                    }
                    
                    // Activer uniquement si c'est la route la plus spécifique trouvée
                    const isActive = activeItemHref === item.href;
                    
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "hover:sidebar-item-active",
                            isActive && "sidebar-item-active"
                          )}
                        >
                          <Link href={item.href} className="flex items-center gap-3 w-full group/item">
                            <SolarIcon
                              icon={item.icon as any}
                              className={cn(
                                "h-4 w-4 flex-shrink-0 transition-transform",
                                isActive
                                  ? "icon-gradient-active"
                                  : "icon-gradient-light group-hover/item:icon-gradient-active"
                              )}
                            />
                            <span
                              className={cn(
                                "text-sm font-medium transition-all flex-1",
                                isActive
                                  ? "text-gradient-active"
                                  : "text-gradient-light group-hover/item:text-gradient-active"
                              )}
                            >
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ));
        })()}
      </SidebarContent>

      <SidebarFooter className="px-[18px] pb-6 pt-4 border-t border-sidebar-border/50">
        <UserProfileCard user={user} accounts={accounts} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

