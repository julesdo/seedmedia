"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

/**
 * Page de confirmation après paiement Stripe réussi
 */
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isVerified, setIsVerified] = useState(false);

  // Vérifier le statut du paiement
  const payment = useQuery(
    api.payments.getPaymentBySessionId,
    sessionId ? { sessionId } : "skip"
  );

  // Récupérer TOUS les articles (pas de limite, toutes les données)
  // @ts-expect-error - Type instantiation issue with Convex (false positive)
  const articles = useQuery(api.articles.getArticles, {
    limit: 1000, // Limite élevée pour avoir tous les articles
    sortBy: "recent",
  });

  useEffect(() => {
    if (payment && payment.status === "completed") {
      setIsVerified(true);
    }
  }, [payment]);

  if (!sessionId) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Session introuvable</CardTitle>
            <CardDescription>
              Aucune session de paiement trouvée. Si vous avez effectué un paiement, contactez le support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/profile">Retour au profil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (payment.status === "completed" && isVerified) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Confirmation de paiement */}
        <Card className="border-green-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 size-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <SolarIcon icon="check-circle-bold" className="size-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Paiement réussi !</CardTitle>
            <CardDescription>
              Votre achat a été traité avec succès
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pack acheté</span>
                <span className="font-semibold">{payment.pack.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Seeds crédités</span>
                <SeedDisplay amount={payment.seedsAwarded} variant="default" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Montant payé</span>
                <span className="font-semibold">
                  {(payment.amount / 100).toFixed(2)}€
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des articles - Affichage direct avec toutes les données */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Articles récents</h2>
          </div>

          {articles === undefined ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-32 h-32 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <SolarIcon icon="document-text-bold" className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun article disponible</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article._id} className="hover:shadow-md transition-shadow">
                  <Link href={`/articles/${article.slug}`}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Image de couverture */}
                        {article.coverImage && (
                          <div className="w-32 h-32 rounded-lg overflow-hidden shrink-0 bg-muted">
                            <Image
                              src={article.coverImage}
                              alt={article.title}
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Contenu */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Titre et auteur */}
                          <div>
                            <h3 className="text-lg font-semibold line-clamp-2 mb-2">
                              {article.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {article.author?.image && (
                                <Avatar className="size-5">
                                  <AvatarImage src={article.author.image} />
                                  <AvatarFallback>
                                    {article.author.name?.[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span>{article.author?.name || "Auteur"}</span>
                              {article.publishedAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Résumé */}
                          {article.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {article.summary}
                            </p>
                          )}

                          {/* Métadonnées */}
                          <div className="flex items-center gap-4 flex-wrap">
                            {/* Catégories */}
                            {article.categories && article.categories.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {article.categories.map((category) => (
                                  <Badge
                                    key={category._id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {category.icon && (
                                      <SolarIcon icon={category.icon as any} className="size-3 mr-1" />
                                    )}
                                    {category.name}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Score de qualité */}
                            {article.qualityScore !== undefined && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <SolarIcon icon="star-bold" className="size-3" />
                                <span>{article.qualityScore.toFixed(1)}</span>
                              </div>
                            )}

                            {/* Vues */}
                            {article.views !== undefined && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <SolarIcon icon="eye-bold" className="size-3" />
                                <span>{article.views}</span>
                              </div>
                            )}

                            {/* Tags */}
                            {article.tags && article.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {article.tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                                {article.tags.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{article.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (payment.status === "pending") {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Paiement en cours de traitement</CardTitle>
            <CardDescription>
              Votre paiement est en cours de validation. Vous recevrez vos Seeds dans quelques instants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/profile">Retour au profil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Statut du paiement</CardTitle>
          <CardDescription>
            Statut : {payment.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/profile">Retour au profil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

