"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useMemo, Suspense } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ActionCard } from "@/components/actions/ActionCard";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CategoryPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Récupérer la catégorie
  const category = useQuery(api.categories.getCategoryBySlug, slug ? { slug } : "skip");
  
  // Récupérer tous les contenus
  const allArticles = useQuery(api.content.getLatestArticles, { limit: 200 });
  const allProjects = useQuery(api.projects.getProjects, { limit: 200 });
  const allActions = useQuery(api.actions.getActions, { limit: 200 });
  const allDebates = useQuery(api.debates.getOpenDebates, { limit: 200 });

  // Filtrer les contenus par catégorie
  const filteredArticles = useMemo(() => {
    if (!allArticles || !category) return [];
    return allArticles.filter((article) =>
      article.categories?.some((cat) => cat.slug === category.slug || cat._id === category._id)
    );
  }, [allArticles, category]);

  const filteredProjects = useMemo(() => {
    if (!allProjects || !category) return [];
    return allProjects.filter((project) =>
      project.categoryIds?.includes(category._id)
    );
  }, [allProjects, category]);

  const filteredActions = useMemo(() => {
    if (!allActions || !category) return [];
    return allActions.filter((action) =>
      action.categoryIds?.includes(category._id)
    );
  }, [allActions, category]);

  const filteredDebates = useMemo(() => {
    if (!allDebates || !category) return [];
    return allDebates.filter((debate) =>
      debate.categoryIds?.includes(category._id)
    );
  }, [allDebates, category]);

  const totalCount = filteredArticles.length + filteredProjects.length + filteredActions.length + filteredDebates.length;

  if (category === undefined || allArticles === undefined || allProjects === undefined || allActions === undefined || allDebates === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center py-16">
            <SolarIcon icon="tag-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-base font-semibold mb-2">Catégorie introuvable</p>
            <p className="text-sm text-muted-foreground">
              La catégorie que vous recherchez n'existe pas ou a été supprimée.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {category.icon && (
                <SolarIcon icon={category.icon} className="h-8 w-8 text-primary" />
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            {totalCount > 0 && (
              <Badge variant="secondary" className="h-7 px-3 text-xs font-semibold">
                {totalCount} résultat{totalCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Contenus par type */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              Tout ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="articles">
              Articles ({filteredArticles.length})
            </TabsTrigger>
            <TabsTrigger value="projects">
              Projets ({filteredProjects.length})
            </TabsTrigger>
            <TabsTrigger value="actions">
              Actions ({filteredActions.length})
            </TabsTrigger>
            <TabsTrigger value="debates">
              Débats ({filteredDebates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {totalCount === 0 ? (
              <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
                <SolarIcon icon="tag-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-base font-semibold mb-2">Aucun contenu trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Aucun contenu n'a été publié dans cette catégorie pour le moment.
                </p>
              </div>
            ) : (
              <>
                {filteredArticles.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredArticles.map((article) => (
                        <ArticleCard key={article._id} article={article} />
                      ))}
                    </div>
                  </div>
                )}
                {filteredProjects.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Projets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProjects.map((project) => (
                        <ProjectCard key={project._id} project={project} />
                      ))}
                    </div>
                  </div>
                )}
                {filteredActions.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredActions.map((action) => (
                        <ActionCard key={action._id} action={action} />
                      ))}
                    </div>
                  </div>
                )}
                {filteredDebates.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Débats</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredDebates.length} débat{filteredDebates.length > 1 ? "s" : ""} trouvé{filteredDebates.length > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="articles">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
                <SolarIcon icon="document-text-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-base font-semibold mb-2">Aucun article trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Aucun article n'a été publié dans cette catégorie pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
                <SolarIcon icon="rocket-2-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-base font-semibold mb-2">Aucun projet trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Aucun projet n'a été publié dans cette catégorie pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions">
            {filteredActions.length === 0 ? (
              <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
                <SolarIcon icon="hand-stars-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-base font-semibold mb-2">Aucune action trouvée</p>
                <p className="text-sm text-muted-foreground">
                  Aucune action n'a été publiée dans cette catégorie pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActions.map((action) => (
                  <ActionCard key={action._id} action={action} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="debates">
            {filteredDebates.length === 0 ? (
              <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
                <SolarIcon icon="question-circle-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-base font-semibold mb-2">Aucun débat trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Aucun débat n'a été publié dans cette catégorie pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {filteredDebates.length} débat{filteredDebates.length > 1 ? "s" : ""} trouvé{filteredDebates.length > 1 ? "s" : ""}
                </p>
                {/* TODO: Ajouter un composant DebateCard quand il sera créé */}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}

