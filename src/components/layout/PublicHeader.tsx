"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CredibilityBadge } from "@/components/credibility/CredibilityBadge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Breadcrumb } from "./Breadcrumb";
import { SearchModal } from "./SearchModal";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelectorCompact } from "@/components/translation/LanguageSelectorCompact";

export function PublicHeader() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser);
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/60 bg-background/95 px-4 md:px-6 backdrop-blur">
        <div className="flex min-w-0 items-center">
          <Breadcrumb />
        </div>

        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            onClick={() => setIsSearchOpen(true)}
            className="h-8 w-[240px] md:w-[280px] justify-start gap-2 text-xs text-muted-foreground border border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-border/80 transition-all"
          >
            <SolarIcon icon="search-bold" className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Rechercher...</span>
            <kbd className="pointer-events-none ml-auto hidden h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-background px-1 font-mono text-[10px] font-medium opacity-70 sm:flex">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          {/* Language Selector */}
          <LanguageSelectorCompact variant="ghost" size="sm" className="hidden lg:flex" />
          
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-muted/50" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-1.5 px-2 hover:bg-muted/50">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[11px]">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start sm:flex">
                    <span className="text-xs font-medium leading-none">{user.name}</span>
                    <CredibilityBadge compact showLabel={false} className="mt-0.5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 shadow-none border border-border/60">
                <div className="flex items-center gap-2 px-2 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[11px]">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                    <p className="text-xs font-medium leading-none truncate">{user.name}</p>
                    {user.email && (
                      <p className="text-[11px] leading-none text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <CredibilityBadge compact={false} />
                </div>
                <DropdownMenuSeparator className="border-border/60" />
                <DropdownMenuItem asChild className="text-xs">
                  <a href="/studio" className="cursor-pointer">
                    <SolarIcon icon="widget-bold" className="mr-2 h-3.5 w-3.5" />
                    Studio
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-xs">
                  <a href="/studio/articles" className="cursor-pointer">
                    <SolarIcon icon="document-text-bold" className="mr-2 h-3.5 w-3.5" />
                    Mes articles
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-border/60" />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await authClient.signOut();
                      router.push("/sign-in");
                    } catch (error) {
                      console.error("Erreur lors de la déconnexion:", error);
                    }
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive text-xs"
                >
                  <SolarIcon icon="logout-3-bold" className="mr-2 h-3.5 w-3.5" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="accent"
                size="sm"
                onClick={() => router.push("/sign-in")}
                className="h-8 px-3 text-xs hidden sm:flex"
              >
                Se connecter
              </Button>
              <Button 
                size="sm" 
                onClick={() => router.push("/sign-up")}
                variant="ghost"
                className="h-8 px-3 text-xs border border-border/60 hover:bg-muted/50"
              >
                S'inscrire
              </Button>
            </div>
          )}
        </div>
      </header>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}

