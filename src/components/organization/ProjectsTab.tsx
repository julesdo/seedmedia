"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { Id } from "../../../../convex/_generated/dataModel";

interface ProjectsTabProps {
  projects?: any[] | undefined;
}

export function ProjectsTab({ projects }: ProjectsTabProps) {
  // Ne pas afficher de skeleton, utiliser les données en cache ou afficher vide
  if (projects === undefined) {
    return null;
  }

  if (projects.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SolarIcon icon="folder-with-files-bold" className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Aucun projet</EmptyTitle>
          <EmptyDescription>
            Cette organisation n'a pas encore publié de projets.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const stageLabels: Record<string, string> = {
    idea: "Idée",
    prototype: "Prototype",
    beta: "Bêta",
    production: "Production",
  };

  const stageColors: Record<string, string> = {
    idea: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    prototype: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    beta: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    production: "bg-green-500/20 text-green-500 border-green-500/30",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project._id} className="h-full hover:scale-[1.02] transition-transform group relative">
          {/* Bouton favori en haut à droite */}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton
              targetType="project"
              targetId={project._id as Id<"projects">}
              variant="ghost"
              size="sm"
              className="backdrop-blur-sm bg-background/90"
            />
          </div>
          <Link href={`/projects/${project.slug}`}>
            {project.images && project.images.length > 0 && (
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-t-lg">
                <img
                  src={project.images[0]}
                  alt={project.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </AspectRatio>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-3 mb-2">
                <Badge variant="outline" className={stageColors[project.stage]}>
                  {stageLabels[project.stage]}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground opacity-70">
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="eye-bold" className="h-3 w-3" />
                    <span>{project.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="heart-bold" className="h-3 w-3" />
                    <span>{project.reactions}</span>
                  </div>
                </div>
              </div>
              <CardTitle className="text-gradient-light group-hover:text-primary transition-colors line-clamp-2">
                {project.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground opacity-80 mt-2 line-clamp-2">
                {project.summary}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.tags.length - 4}
                  </Badge>
                )}
              </div>
              {project.openSource && (
                <Badge variant="outline" className="mt-2 bg-purple-500/20 text-purple-500 border-purple-500/30">
                  <SolarIcon icon="code-bold" className="h-3 w-3 mr-1" />
                  Open Source
                </Badge>
              )}
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}

