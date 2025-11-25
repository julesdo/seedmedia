"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import Image from "next/image";

export default function DossiersPage() {
  const dossiers = useQuery(api.dossiers.getDossiers, {
    limit: 50,
  });

  // État de chargement
  if (dossiers === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold">Dossiers thématiques</h1>
        <p className="text-muted-foreground text-lg">
          Explorez nos dossiers regroupant des articles autour de thématiques clés de la résilience technologique.
        </p>
      </header>

      {dossiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <SolarIcon icon="document-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun dossier disponible pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dossiers.map((dossier) => (
            <Link key={dossier._id} href={`/dossiers/${dossier.slug}`}>
              <Card className="h-full border-t-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                {dossier.coverImage && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={dossier.coverImage}
                      alt={dossier.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl line-clamp-2">{dossier.title}</CardTitle>
                    {dossier.featured && (
                      <Badge variant="default" className="shrink-0">
                        <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                        Mis en avant
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">{dossier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dossier.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {dossier.tags && dossier.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{dossier.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" className="w-full">
                    Explorer
                    <SolarIcon icon="arrow-right-bold" className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

