"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";

const STAGE_LABELS = {
  idea: "Idée",
  prototype: "Prototype",
  beta: "Bêta",
  production: "Production",
} as const;

interface ProjectCardProps {
  project: {
    _id: string;
    slug: string;
    title: string;
    summary: string;
    images?: string[] | null;
    stage: "idea" | "prototype" | "beta" | "production";
    tags: string[];
    views?: number;
    openSource?: boolean;
    featured?: boolean;
    createdAt: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projets/${project.slug}`}>
      <article className="group cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-4 bg-muted">
          {project.images && project.images.length > 0 ? (
            <Image
              src={project.images[0]}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
              <SolarIcon icon="rocket-2-bold" className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {project.featured && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="default" className="text-[10px] px-1.5 py-0.5 h-5">
                <SolarIcon icon="star-bold" className="h-2.5 w-2.5 mr-0.5" />
                En vedette
              </Badge>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="space-y-2.5">
          {/* Stage et Open Source */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
              {STAGE_LABELS[project.stage]}
            </Badge>
            {project.openSource && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                <SolarIcon icon="code-bold" className="h-2.5 w-2.5 mr-0.5" />
                Open Source
              </Badge>
            )}
          </div>

          {/* Titre */}
          <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>

          {/* Résumé */}
          {project.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {project.summary}
            </p>
          )}

          {/* Tags et métadonnées */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {project.tags && project.tags.length > 0 && (
              <>
                {project.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </>
            )}
            {project.views !== undefined && project.views > 0 && (
              <>
                {project.tags && project.tags.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">•</span>
                )}
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <SolarIcon icon="eye-bold" className="h-3 w-3" />
                  {project.views}
                </span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

