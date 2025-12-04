"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CredibilityProgress } from "@/components/credibility/CredibilityProgress";
import { CredibilityBreakdown } from "@/components/credibility/CredibilityBreakdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CredibilityHistory } from "@/components/credibility/CredibilityHistory";
import { CredibilityActions } from "@/components/credibility/CredibilityActions";

export default function CredibilitePage() {
  const user = useQuery(api.auth.getCurrentUser);
  const breakdown = useQuery(
    api.credibility.getCredibilityBreakdown,
    user?._id ? { userId: user._id } : "skip"
  );
  const history = useQuery(
    api.credibility.getCredibilityHistory,
    user?._id ? { userId: user._id, limit: 20 } : "skip"
  );

  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Ma crédibilité</h1>
            <p className="text-sm text-muted-foreground">
              Comprenez et suivez votre score de crédibilité
            </p>
          </div>
          <Card className="border border-border/60 bg-card">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const score = user.credibilityScore || 0;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Ma crédibilité</h1>
          <p className="text-sm text-muted-foreground">
            Comprenez et suivez votre score de crédibilité sur Seed
          </p>
        </div>

        {/* Score principal */}
        <Card className="border border-border/60 bg-card">
          <CardContent className="pt-6">
            <CredibilityProgress score={score} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="breakdown" className="space-y-6">
          <TabsList>
            <TabsTrigger value="breakdown">Décomposition</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="actions">Comment gagner des points</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="space-y-6">
            {breakdown === undefined ? (
              <Card className="border border-border/60 bg-card">
                <CardContent className="p-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : breakdown === null ? (
              <Card className="border border-border/60 bg-card">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Impossible de charger les données de crédibilité
                  </p>
                </CardContent>
              </Card>
            ) : (
              <CredibilityBreakdown breakdown={breakdown.breakdown} />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <CredibilityHistory history={history || []} />
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <CredibilityActions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

