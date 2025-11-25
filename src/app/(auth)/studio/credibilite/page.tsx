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

  if (user === undefined || breakdown === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ma crédibilité</h1>
          <p className="text-muted-foreground mt-2">
            Comprenez et suivez votre score de crédibilité
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const score = user.credibilityScore || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ma crédibilité</h1>
        <p className="text-muted-foreground mt-2">
          Comprenez et suivez votre score de crédibilité sur Seed
        </p>
      </div>

      {/* Score principal */}
      <Card>
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
          {breakdown ? (
            <CredibilityBreakdown breakdown={breakdown.breakdown} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
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
  );
}

