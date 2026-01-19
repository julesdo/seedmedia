"use client";

import { Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useConvexAuth } from "convex/react";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function NotificationsContent() {
  const t = useTranslations('notifications');
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);

  const notifications = useQuery(
    api.notifications.getAllNotifications,
    isAuthenticated ? { limit: 100 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadNotificationsCount,
    isAuthenticated ? {} : "skip"
  ) || 0;

  const handleNotificationClick = async (notificationId: string, link?: string) => {
    if (!isAuthenticated) return;
    
    try {
      await markAsRead({ notificationId: notificationId as any });
      if (link) {
        router.push(link);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header - Masqué en mobile */}
        <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="max-w-[614px] mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <SolarIcon icon="bell-bold" className="size-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('description')}
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div className="max-w-[614px] mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SolarIcon icon="bell-bold" className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('notAuthenticated.title')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('notAuthenticated.description')}
            </p>
            <Button onClick={() => router.push("/sign-in")}>
              {t('notAuthenticated.signIn')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (notifications === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[614px] mx-auto px-4 py-6">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-[614px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <SolarIcon icon="bell-bold" className="size-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
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
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-[614px] mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SolarIcon icon="bell-bold" className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('empty.description')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Notifications non lues */}
            {unreadNotifications.length > 0 && (
              <>
                {unreadNotifications.map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    id={notification._id}
                    type={notification.type}
                    title={notification.title}
                    message={notification.message}
                    link={notification.link}
                    read={notification.read}
                    createdAt={notification.createdAt}
                    onClick={() => handleNotificationClick(notification._id, notification.link)}
                  />
                ))}
                {readNotifications.length > 0 && (
                  <Separator className="my-4" />
                )}
              </>
            )}

            {/* Notifications lues */}
            {readNotifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                id={notification._id}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                link={notification.link}
                read={notification.read}
                createdAt={notification.createdAt}
                onClick={() => handleNotificationClick(notification._id, notification.link)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Espace pour la bottom nav mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-[614px] mx-auto px-4 py-6">
            <Skeleton className="h-12 w-full mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
