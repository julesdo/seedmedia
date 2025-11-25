"use client";

import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "next-view-transitions";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface Dossier {
  _id: string;
  title: string;
  description: string;
  slug: string;
  coverImage?: string;
  tags: string[];
  articlesCount: number;
}

interface HomeDossiersProps {
  dossiers: Dossier[];
}

export function HomeDossiers({ dossiers }: HomeDossiersProps) {
  if (dossiers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun dossier pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {dossiers.map((dossier) => (
        <Card key={dossier._id} className="group border-t-2 border-transparent hover:border-primary transition-colors overflow-hidden">
          <Link href={`/dossiers/${dossier.slug}`}>
            {dossier.coverImage ? (
              <div className="relative aspect-[21/9] w-full overflow-hidden">
                <OptimizedImage
                  src={dossier.coverImage}
                  alt={dossier.title}
                  className="object-cover transition-transform group-hover:scale-105"
                  fill
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                <CardHeader className="absolute bottom-0 left-0 right-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dossier.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs text-white/70">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <CardTitle className="text-white">{dossier.title}</CardTitle>
                  <CardDescription className="text-white/90 drop-shadow line-clamp-2">
                    {dossier.description}
                  </CardDescription>
                  <div className="mt-2 text-xs text-white/80">
                    {dossier.articlesCount} articles
                  </div>
                </CardHeader>
              </div>
            ) : (
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dossier.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
                <CardTitle>{dossier.title}</CardTitle>
                <CardDescription className="line-clamp-2">{dossier.description}</CardDescription>
                <div className="mt-2 text-xs text-muted-foreground">
                  {dossier.articlesCount} articles
                </div>
              </CardHeader>
            )}
          </Link>
        </Card>
      ))}
    </div>
  );
}

