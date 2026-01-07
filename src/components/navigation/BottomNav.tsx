"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from 'next-intl';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const t = useTranslations('navigation');

  // Récupérer la dernière décision pour rediriger vers son détail
  // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
  const latestDecision = useQuery(api.decisions.getDecisions, { 
    limit: 1
  });

  const navItems = [
    {
      label: t('home'),
      href: "/",
      icon: "home-2-bold",
    },
    {
      label: t('trending'),
      href: latestDecision && latestDecision.length > 0 
        ? `/${latestDecision[0].slug}` 
        : "#",
      icon: "fire-bold",
    },
    {
      label: t('map'),
      href: "/map",
      icon: "map-point-bold",
    },
    {
      label: t('bots'),
      href: "/bots",
      icon: "smile-square-bold",
    },
    {
      label: t('profile'),
      href: "/profile",
      icon: "user-bold",
      isProfile: true,
    },
  ];

  // Extraire les données utilisateur de manière sécurisée
  const userImage = user?.image;
  const userName = user?.name;
  const userEmail = user?.email;
  const username = user?.username;

  // Déterminer l'URL du profil
  const profileHref = username ? `/u/${username}` : "/profile";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80 lg:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isProfile = item.isProfile;
          const href = isProfile ? profileHref : item.href;
          const isActive = pathname === href || (isProfile && username && pathname === `/u/${username}`);
          
          return (
            <Link
              key={item.href}
              href={href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 w-full h-full",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <div className="relative flex items-center justify-center h-8">
                {isProfile && isAuthenticated && user ? (
                  <Avatar className={cn(
                    "size-8 transition-all duration-200 ring-2",
                    isActive
                      ? "ring-primary"
                      : "ring-transparent"
                  )}>
                    <AvatarImage 
                      src={userImage || undefined} 
                      alt={userName || userEmail || ""} 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : isProfile && !isAuthenticated ? (
                  <div className="size-8 rounded-full bg-muted/50 flex items-center justify-center">
                    <SolarIcon icon={item.icon} className="size-5" />
                  </div>
                ) : (
                  <SolarIcon
                    icon={item.icon}
                    className={cn(
                      "size-6 transition-all duration-200",
                      isActive && "text-primary"
                    )}
                  />
                )}
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-all leading-tight text-center h-[14px] flex items-center",
                isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

