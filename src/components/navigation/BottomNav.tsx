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
import { useBottomNav } from "@/contexts/BottomNavContext";
import dynamic from "next/dynamic";

// Lazy load Framer Motion pour réduire le bundle initial
const MotionButton = dynamic(
  () => import("motion/react").then((mod) => mod.motion.button),
  { 
    ssr: false,
    loading: () => <button />,
  }
);
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useEffect } from "react";

interface BottomNavProps {
  transparent?: boolean; // Mode transparent pour les reels
}

export function BottomNav({ transparent = false }: BottomNavProps) {
  const { fabs, investButton } = useBottomNav();
  const hasCustomContent = fabs.length > 0 || investButton !== null;
  const pathname = usePathname();
  const router = useRouter();
  const { navigate } = useInstantNavigation();
  const { user, isAuthenticated } = useUser();
  const t = useTranslations('navigation');


  const navItems = [
    {
      label: t('home'),
      href: "/",
      icon: "home-2-bold",
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

  // Précharger agressivement toutes les routes principales au montage
  useEffect(() => {
    const routes = ["/", "/portfolio", "/challenges", "/profile", profileHref];
    routes.forEach(route => {
      if (route && route !== "#") {
        router.prefetch(route);
      }
    });
  }, [router, profileHref]);

  // Si on a des FABs ou un bouton Investir, afficher le mode personnalisé
  if (hasCustomContent) {
    return (
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "border-t border-border/50 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80"
      )}>
        <div className="flex items-center gap-2 px-2 py-2 h-20 pb-safe">
          {/* Bouton Investir */}
          {investButton && (
            <div className="flex-1 min-w-0">
              {investButton}
            </div>
          )}
          
          {/* FABs à droite */}
          {fabs.length > 0 && (
            <div className="flex items-center gap-2">
              {fabs.map((fab) => (
                <MotionButton
                  key={fab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fab.onClick}
                  className={cn(
                    "size-12 rounded-xl flex flex-col items-center justify-center gap-0.5",
                    "border border-border/50 bg-background/80 backdrop-blur-md",
                    "text-muted-foreground hover:border-primary/50 hover:bg-primary/5",
                    "hover:shadow-lg hover:shadow-primary/20 hover:text-primary",
                    "transition-all duration-300 relative"
                  )}
                >
                  <SolarIcon icon={fab.icon as any} className="size-5" />
                  <span className="text-[9px] font-medium leading-tight">{fab.label}</span>
                  {fab.badge !== undefined && fab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                      {fab.badge > 9 ? '9+' : fab.badge}
                    </span>
                  )}
                </MotionButton>
              ))}
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Mode navigation normale
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
      transparent
        ? "border-t border-white/20 bg-white/10 backdrop-blur-md supports-backdrop-filter:bg-white/5"
        : "border-t border-border/50 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80"
    )}>
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isProfile = item.isProfile;
          const href = isProfile ? profileHref : item.href;
          const isActive = pathname === href || (isProfile && username && pathname === `/u/${username}`);
          
          return (
            <button
              key={item.href}
              onClick={(e) => {
                e.preventDefault();
                if (href && href !== "#") {
                  navigate(href);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-colors duration-150 active:opacity-70 w-full h-full",
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
                "text-[11px] font-medium transition-colors leading-tight text-center h-[14px] flex items-center",
                transparent
                  ? isActive ? "font-semibold text-white" : "font-normal text-white/70"
                  : isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

