"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import { AdminSidebarLayout } from "@/components/admin/AdminSidebarLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);

  useEffect(() => {
    if (isSuperAdmin === false) {
      // Rediriger vers la home si pas super admin
      router.push("/");
    }
  }, [isSuperAdmin, router]);

  // Loading state
  if (isSuperAdmin === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Not authorized
  if (isSuperAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <Alert variant="destructive">
            <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="space-y-4">
                <p className="font-semibold">Accès refusé</p>
                <p className="text-sm">
                  Cet espace est réservé aux super administrateurs de l'équipe Seed Tech.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}

