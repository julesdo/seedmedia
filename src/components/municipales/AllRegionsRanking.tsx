"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { RegionRanking } from "./RegionRanking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AllRegionsRanking() {
  const rankings = useQuery(api.municipalesRankings.getAllRegionsRankings, {
    limitPerRegion: 3,
  });

  if (rankings === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Classement par Région</CardTitle>
          <CardDescription>Top 3 de chaque région</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Classement par Région</CardTitle>
          <CardDescription>Top 3 de chaque région</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <SolarIcon icon="users-group-rounded-bold" className="size-12 mx-auto mb-2 opacity-50" />
            <p>Aucun classement disponible pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Classement par Région</CardTitle>
        <CardDescription>Top 3 des meilleurs prévisionnistes par région</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={rankings[0]?.region} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4">
            {rankings.map((ranking) => (
              <TabsTrigger key={ranking.region} value={ranking.region} className="text-xs">
                {ranking.region}
              </TabsTrigger>
            ))}
          </TabsList>
          {rankings.map((ranking) => (
            <TabsContent key={ranking.region} value={ranking.region}>
              <RegionRanking region={ranking.region} limit={10} showTitle={false} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

