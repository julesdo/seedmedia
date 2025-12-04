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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CredibilityBadge } from "@/components/credibility/CredibilityBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { LanguageSelectorCompact } from "@/components/translation/LanguageSelectorCompact";
// Traduction désactivée temporairement
// import { TranslatedInput } from "@/components/translation/TranslatedInput";
// import { TranslatedText } from "@/components/translation/TranslatedText";
import { useRouter } from "next/navigation";

export function Header() {
  const user = useQuery(api.users.getCurrentUser);
  const notificationsCount = useQuery(api.notifications.getUnreadNotificationsCount) || 0;
  const notifications = useQuery(api.notifications.getUnreadNotifications) || [];
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);
  const router = useRouter();

  const handleNotificationClick = async (notificationId: Id<"notifications">, link?: string) => {
    await markAsRead({ notificationId });
    if (link) {
      router.push(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

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
          {/* Language */}
          <LanguageSelectorCompact variant="glass" size="sm" />

          {/* Theme Toggle */}
          <ThemeToggle variant="ghost" />

          {/* Credibility Badge */}
          {user && (
            <CredibilityBadge compact showLabel={false} />
          )}

          {/* Notifications */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="glass" size="icon" className="relative">
                <SolarIcon icon="bell-bold" className="h-4 w-4 icon-gradient-light" />
                {notificationsCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
                  >
                    {notificationsCount > 99 ? "99+" : notificationsCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0">
              <SheetHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle>Notifications</SheetTitle>
                    <SheetDescription>
                      {notificationsCount > 0
                        ? `${notificationsCount} notification${notificationsCount > 1 ? "s" : ""} non lue${notificationsCount > 1 ? "s" : ""}`
                        : "Aucune notification"}
                    </SheetDescription>
                  </div>
                  {notificationsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      Tout marquer comme lu
                    </Button>
                  )}
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="p-4 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <SolarIcon icon="bell-off-bold" className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Aucune notification
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className="p-4 rounded-lg border border-border/50 bg-background hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleNotificationClick(notification._id, notification.link)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <SolarIcon
                              icon={
                                notification.type === "correction_approved"
                                  ? "verified-check-bold"
                                  : notification.type === "proposal_vote"
                                  ? "hand-stars-bold"
                                  : notification.type === "debat_argument"
                                  ? "chat-round-bold"
                                  : "notification-bold"
                              }
                              className="h-5 w-5 icon-gradient-light"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gradient-light mb-1">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

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
