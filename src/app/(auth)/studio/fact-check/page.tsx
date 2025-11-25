"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { ApproveButton } from "@/components/studio/ApproveButton";
import { RejectButton } from "@/components/studio/RejectButton";

const CORRECTION_TYPE_LABELS = {
  source: "Source",
  contre_argument: "Contre-argument",
  fact_check: "Fact-check",
  other: "Autre",
} as const;

const STATUS_LABELS = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
} as const;

const STATUS_VARIANTS = {
  pending: "default",
  approved: "default",
  rejected: "destructive",
} as const;

export default function FactCheckPage() {
  const user = useQuery(api.auth.getCurrentUser);
  const isEditor = user?.role === "editeur";

  // La query retourne déjà [] si l'utilisateur n'est pas éditeur
  const pendingCorrections = useQuery(api.articleCorrections.getPendingCorrections, {});
  const myCorrections = useQuery(api.articleCorrections.getMyCorrections, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fact-check & corrections</h1>
        <p className="text-muted-foreground mt-2">
          Proposez des corrections et validez les contributions de la communauté
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            En attente
            {pendingCorrections !== undefined && pendingCorrections !== null && (
              <Badge variant="secondary" className="ml-2">
                {(pendingCorrections as any[]).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my">
            Mes propositions
            {myCorrections !== undefined && myCorrections !== null && (
              <Badge variant="secondary" className="ml-2">
                {(myCorrections as any[]).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isEditor ? (
            <Card>
              <CardHeader>
                <CardTitle>File de relecture</CardTitle>
                <CardDescription>
                  Propositions de correction en attente de validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingCorrections === undefined ? (
                  <Skeleton className="h-64 w-full" />
                ) : (pendingCorrections as any[]).length === 0 ? (
                  <div className="text-center py-12">
                    <SolarIcon
                      icon="verified-check-bold"
                      className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                    />
                    <h3 className="text-lg font-semibold mb-2">
                      Aucune correction en attente
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Toutes les propositions ont été traitées
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(pendingCorrections as any[]).map((correction: any) => (
                      <Card key={correction._id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {CORRECTION_TYPE_LABELS[
                                  correction.correctionType as keyof typeof CORRECTION_TYPE_LABELS
                                ]}
                              </Badge>
                              <span className="text-sm font-medium">{correction.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {correction.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Article : {correction.articleId || "N/A"}
                              </span>
                              <span>
                                {formatDistanceToNow(new Date(correction.createdAt), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <ApproveButton correctionId={correction._id} />
                            <RejectButton correctionId={correction._id} />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <SolarIcon
                  icon="lock-bold"
                  className="h-16 w-16 mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  Accès réservé aux éditeurs
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vous devez être éditeur pour accéder à la file de fact-check
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes propositions de correction</CardTitle>
              <CardDescription>
                Suivez l'état de vos propositions de correction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myCorrections === undefined ? (
                <Skeleton className="h-64 w-full" />
              ) : (myCorrections as any[]).length === 0 ? (
                <div className="text-center py-12">
                  <SolarIcon
                    icon="pen-bold"
                    className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                  />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucune proposition pour le moment
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Proposez des corrections sur les articles pour améliorer leur qualité
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(myCorrections as any[]).map((correction: any) => (
                    <Card key={correction._id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                STATUS_VARIANTS[
                                  correction.status as keyof typeof STATUS_VARIANTS
                                ] as any
                              }
                            >
                              {
                                STATUS_LABELS[
                                  correction.status as keyof typeof STATUS_LABELS
                                ]
                              }
                            </Badge>
                            <span className="text-sm font-medium">{correction.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {correction.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(correction.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

