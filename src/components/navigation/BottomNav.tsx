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

interface BottomNavProps {
  transparent?: boolean; // Mode transparent pour les reels
}

export function BottomNav({ transparent = false }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const t = useTranslations('navigation');

  // Récupérer la dernière décision pour rediriger vers son détail
  // ✅ Protection : skip si Convex n'est pas disponible
  // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
  const latestDecision = useQuery(api.decisions.getDecisions, { 
    limit: 1
  }) || undefined;

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
      label: t('portfolio'),
      href: "/portfolio",
      icon: "wallet-bold",
    },
    {
      label: t('challenges'),
      href: "/challenges",
      icon: "target-bold",
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
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
      transparent
        ? "border-t border-white/20 bg-white/10 backdrop-blur-md supports-backdrop-filter:bg-white/5"
        : "border-t border-border/50 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80"
    )}>
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
              data-prefetch="viewport"
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 w-full h-full",
                transparent
                  ? isActive
                    ? "text-white"
                    : "text-white/70"
                  : isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
            >
              <div className="relative flex items-center justify-center h-8">
                {isProfile && isAuthenticated && user ? (
                  <Avatar className={cn(
                    "size-8 transition-all duration-200 ring-2",
                    transparent
                      ? isActive
                        ? "ring-white/50"
                        : "ring-transparent"
                      : isActive
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
                      transparent
                        ? isActive && "text-white"
                        : isActive && "text-primary"
                    )}
                  />
                )}
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-all leading-tight text-center h-[14px] flex items-center",
                transparent
                  ? isActive ? "font-semibold text-white" : "font-normal text-white/70"
                  : isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
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

