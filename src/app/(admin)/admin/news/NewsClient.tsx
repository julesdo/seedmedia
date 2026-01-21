"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";

/**
 * Page de gestion des news
 */
export function NewsClient() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">News</h2>
          <p className="text-muted-foreground">
            Gérer toutes les news de l'application
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">
            <SolarIcon icon="add-circle-bold" className="size-4 mr-2" />
            Créer une news
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des news</CardTitle>
          <CardDescription>
            Gérer les news et les lier aux décisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            À implémenter
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

