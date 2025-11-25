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
  {
    items: [
      {
        title: "Dashboard Home",
        href: "/studio",
        icon: "home-bold",
      },
    ],
  },
      {
        title: "Production",
        items: [
          {
            title: "Mes articles",
            href: "/studio/articles",
            icon: "document-bold",
          },
          {
            title: "Rédiger un article",
            href: "/studio/articles/nouveau",
            icon: "pen-new-round-bold",
          },
          {
            title: "Mes projets",
            href: "/studio/projets",
            icon: "folder-bold",
          },
          {
            title: "Nouveau projet",
            href: "/studio/projets/nouveau",
            icon: "add-circle-bold",
          },
          {
            title: "Mes actions",
            href: "/studio/actions",
            icon: "hand-stars-bold",
          },
          {
            title: "Nouvelle action",
            href: "/studio/actions/nouvelle",
            icon: "add-circle-bold",
          },
          {
            title: "Mes débats",
            href: "/studio/debats",
            icon: "question-circle-bold",
          },
          {
            title: "Créer un débat",
            href: "/studio/debats/nouveau",
            icon: "add-circle-bold",
          },
          {
            title: "Fact-check & corrections",
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
        title: "Règles configurables",
        href: "/studio/gouvernance/regles",
        icon: "list-check-bold",
      },
      {
        title: "Statistiques",
        href: "/studio/stats",
        icon: "chart-2-bold",
      },
    ],
  },
      {
        title: "Profil",
        items: [
          {
            title: "Mes favoris",
            href: "/studio/favoris",
            icon: "star-bold",
          },
          {
            title: "Missions",
            href: "/studio/missions",
            icon: "rocket-bold",
          },
          {
            title: "Ma crédibilité",
            href: "/studio/credibilite",
            icon: "star-bold",
          },
        ],
      },
  {
    title: "Expérimental",
    items: [
      {
        title: "Labs",
        href: "/studio/labs",
        icon: "test-tube-bold",
      },
    ],
  },
  {
    title: "Organisations",
    items: [
      {
        title: "Mes organisations",
        href: "/studio/organizations",
        icon: "buildings-bold",
      },
      {
        title: "Découvrir",
        href: "/studio/organizations/discover",
        icon: "magnifer-bold",
      },
    ],
  },
  {
    title: "Compte",
    items: [
      {
        title: "Profil",
        href: "/studio/profile",
        icon: "user-bold",
      },
      {
        title: "Comptes",
        href: "/studio/accounts",
        icon: "user-id-bold",
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
];

export function StudioSidebar() {
  const pathname = usePathname();
  const user = useQuery(api.auth.getCurrentUser);
  const accounts = useQuery(api.accounts.getUserAccounts);

  return (
    <Sidebar className="w-[18rem] border-r border-sidebar-border/50 backdrop-blur-[18px]">
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
        {studioNavSections.map((section, sectionIndex) => (
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
                  
                  // Logique d'activation basée sur TOUS les segments de la route
                  // Extraire tous les segments de la route actuelle
                  const pathSegments = pathname.split("/").filter(Boolean);
                  
                  // Extraire tous les segments de l'href de l'item
                  const itemSegments = item.href.split("/").filter(Boolean);
                  
                  // L'item est actif si tous les segments correspondent exactement
                  // et que le nombre de segments est identique
                  const isActive = 
                    pathSegments.length === itemSegments.length &&
                    pathSegments.every((segment, index) => segment === itemSegments[index]);
                  
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
        ))}
      </SidebarContent>

      <SidebarFooter className="px-[18px] pb-6 pt-4 border-t border-sidebar-border/50">
        <UserProfileCard user={user} accounts={accounts} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

