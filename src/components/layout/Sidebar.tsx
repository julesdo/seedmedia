"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import React from "react";
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
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserProfileCard } from "./UserProfileCard";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Actions rapides",
    items: [
      {
        title: "Création rapide",
        href: "/create",
        icon: "add-circle-bold",
      },
    ],
  },
  {
    title: "Explorer",
    items: [
      {
        title: "Découvrir",
        href: "/studio",
        icon: "magnifer-bold",
      },
      {
        title: "Articles",
        href: "/studio/articles",
        icon: "document-bold",
      },
      {
        title: "Carte",
        href: "/map",
        icon: "map-point-bold",
      },
      {
        title: "Projets",
        href: "/projects",
        icon: "folder-bold",
      },
      {
        title: "Actions",
        href: "/actions",
        icon: "hand-stars-bold",
      },
      {
        title: "Jobs",
        href: "/jobs",
        icon: "case-bold",
      },
    ],
  },
  {
    title: "Membre premium",
    items: [
      {
        title: "Campagnes",
        href: "/campaigns",
        icon: "megaphone-bold",
      },
      {
        title: "Statistiques",
        href: "/statistics",
        icon: "chart-bold",
      },
      {
        title: "Badges",
        href: "/badges",
        icon: "medal-ribbons-star-bold",
      },
    ],
  },
  {
    title: "Compte",
    items: [
      {
        title: "Comptes",
        href: "/accounts",
        icon: "user-id-bold",
      },
      {
        title: "Invitations",
        href: "/invitations",
        icon: "mailbox-bold",
      },
      {
        title: "Paramètres",
        href: "/settings",
        icon: "settings-bold",
      },
      {
        title: "Aide",
        href: "/help",
        icon: "question-circle-bold",
      },
    ],
  },
];

function AppSidebar() {
  const pathname = usePathname();
  const user = useQuery(api.users.getCurrentUser);
  const accounts = useQuery(api.accounts.getUserAccounts);
  const invitations = useQuery(api.invitations.getUserInvitations);
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  const createDefaultAccount = useMutation(api.accounts.createDefaultAccount);
  
  // Compter les invitations en attente
  const pendingInvitationsCount = invitations 
    ? invitations.filter(inv => inv.status === "pending").length 
    : 0;
  
  // S'assurer que l'utilisateur existe dans la table users
  React.useEffect(() => {
    if (user && (!user._id || user._id === undefined)) {
      // L'utilisateur Better Auth existe mais pas dans la table users
      ensureUserExists().catch((error) => {
        console.error("Failed to ensure user exists:", error);
      });
    }
  }, [user, ensureUserExists]);
  
  // Créer le compte par défaut s'il n'existe pas encore
  React.useEffect(() => {
    if (user && user._id && accounts && accounts.length === 0) {
      // Créer le compte par défaut automatiquement
      createDefaultAccount();
    }
  }, [user, accounts, createDefaultAccount]);

  return (
    <Sidebar className="w-[18rem] border-r border-sidebar-border/50 backdrop-blur-[18px]">
      <SidebarHeader className="px-[18px] h-16 flex border-b border-sidebar-border/50">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.svg"
            alt="Seed"
            width={91}
            height={37}
            className="h-10 w-auto transition-opacity group-hover:opacity-90"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-[18px] pt-6">
        {navSections.map((section, sectionIndex) => (
          <SidebarGroup key={sectionIndex} className="space-y-3">
            {section.title && (
              <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-[0.03em] opacity-50">
                <span className="text-gradient-light">{section.title}</span>
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/studio" && pathname.startsWith(item.href + "/")) ||
                    (item.href === "/studio" && (pathname === "/studio" || pathname === "/"));
                  const isActionButton = item.href === "/create";

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "sidebar-item h-[36px] px-3 rounded-lg",
                          isActionButton && "sidebar-action-button",
                          isActive && "sidebar-item-active"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <SolarIcon
                            icon={item.icon}
                            className={cn(
                              "h-4 w-4 flex-shrink-0 transition-transform",
                              isActive
                                ? "icon-gradient-active"
                                : "icon-gradient-light"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium transition-all flex-1",
                              isActive
                                ? "text-gradient-active"
                                : "text-gradient-light"
                            )}
                          >
                            {item.title}
                          </span>
                          {item.href === "/invitations" && pendingInvitationsCount > 0 && (
                            <Badge 
                              variant="default" 
                              className="h-5 min-w-5 px-1.5 text-xs font-semibold shrink-0"
                            >
                              {pendingInvitationsCount}
                            </Badge>
                          )}
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

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}
