"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Breadcrumb } from "./Breadcrumb";
import { SolarIcon } from "@/components/icons/SolarIcon";

export function Header() {
  const user = useQuery(api.users.getCurrentUser);
  const notificationsCount = 62; // TODO: Get from Convex

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-sidebar/80 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/80">
      <div className="flex items-center gap-3 px-4 h-16">
        {/* Left: Breadcrumb */}
        <div className="flex-shrink-0 min-w-0">
          <Breadcrumb />
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative">
            <SolarIcon 
              icon="magnifer-bold" 
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 icon-gradient-light z-10" 
            />
            <Input
              type="search"
              placeholder="Rechercher un article, un projet..."
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Level */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="sm" className="gap-1.5 hidden sm:flex">
                <span className="text-gradient-light">Niveau {user?.level || 3}</span>
                <SolarIcon icon="alt-arrow-down-bold" className="h-3.5 w-3.5 icon-gradient-light" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Niveau 1</DropdownMenuItem>
              <DropdownMenuItem>Niveau 2</DropdownMenuItem>
              <DropdownMenuItem>Niveau 3</DropdownMenuItem>
              <DropdownMenuItem>Niveau 4</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Region */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="sm" className="gap-1.5 hidden md:flex">
                <span className="text-gradient-light">{user?.region || "Nouvelle-Aquitaine"}</span>
                <SolarIcon icon="alt-arrow-down-bold" className="h-3.5 w-3.5 icon-gradient-light" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Nouvelle-Aquitaine</DropdownMenuItem>
              <DropdownMenuItem>Île-de-France</DropdownMenuItem>
              <DropdownMenuItem>Auvergne-Rhône-Alpes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="sm" className="gap-1.5 hidden lg:flex">
                <span className="text-gradient-light">FR</span>
                <SolarIcon icon="alt-arrow-down-bold" className="h-3.5 w-3.5 icon-gradient-light" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>FR</DropdownMenuItem>
              <DropdownMenuItem>EN</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="glass" size="icon" className="relative">
            <SolarIcon icon="bell-bold" className="h-4 w-4 icon-gradient-light" />
            {notificationsCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
              >
                {notificationsCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="icon" className="rounded-full p-0.5">
                <Avatar className="h-8 w-8 ring-1 ring-border/50">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light font-semibold">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/settings">Paramètres</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
