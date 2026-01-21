"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * Layout dédié pour l'interface admin
 * - Vérifie les permissions admin
 * - Affiche la sidebar de navigation admin (style identique à DesktopSidebar)
 * - Layout optimisé pour la gestion
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = useQuery(api.admin.isSuperAdmin);

  // Loading state
  if (isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="hidden lg:flex flex-col w-[244px] border-r border-border/50 bg-background p-6">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex-1 lg:pl-[244px] p-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Vous devez être un super administrateur pour accéder à cette section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Si vous pensez que c'est une erreur, contactez un administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized - Show admin layout
  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar />
      <div className="flex-1 flex flex-col lg:pl-[244px]">
        <AdminHeader />
        <Separator />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}


