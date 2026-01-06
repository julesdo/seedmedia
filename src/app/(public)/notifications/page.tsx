"use client";

import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";
import { formatDistanceToNow } from "date-fns";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

function NotificationsContent() {
  const t = useTranslations('notifications');
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  // TODO: Implémenter getNotifications dans convex/notifications.ts
  // const notifications = useQuery(
  //   api.notifications.getMyNotifications,
  //   isAuthenticated ? {} : "skip"
  // );

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

  // Pour l'instant, afficher un état vide
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
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
          <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('empty.description')}
          </p>
        </div>
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
                <Skeleton key={i} className="h-20 w-full" />
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

