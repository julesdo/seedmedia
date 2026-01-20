"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RegionRankingProps {
  region: string;
  limit?: number;
  showTitle?: boolean;
}

export function RegionRanking({ region, limit = 10, showTitle = true }: RegionRankingProps) {
  const ranking = useQuery(api.municipalesRankings.getRegionRanking, {
    region,
    limit,
  });

  if (ranking === undefined) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>🏆 Classement {region}</CardTitle>
            <CardDescription>Top {limit} des meilleurs prévisionnistes</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>🏆 Classement {region}</CardTitle>
            <CardDescription>Top {limit} des meilleurs prévisionnistes</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <SolarIcon icon="users-group-rounded-bold" className="size-12 mx-auto mb-2 opacity-50" />
            <p>Aucun participant dans cette région pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>🏆 Classement {region}</CardTitle>
          <CardDescription>Top {limit} des meilleurs prévisionnistes</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          {ranking.map((user, index) => (
            <Link
              key={user.userId}
              href={`/u/${user.username || user.userId}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Rang */}
              <div className={cn(
                "flex items-center justify-center size-8 rounded-full font-bold text-sm",
                index === 0 && "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
                index === 1 && "bg-gray-400/20 text-gray-600 dark:text-gray-400",
                index === 2 && "bg-orange-600/20 text-orange-600 dark:text-orange-400",
                index > 2 && "bg-muted text-muted-foreground"
              )}>
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
              </div>

              {/* Avatar */}
              <Avatar className="size-10">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Infos utilisateur */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                {user.username && (
                  <div className="text-xs text-muted-foreground">@{user.username}</div>
                )}
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="font-semibold text-sm">
                  {user.correctPredictions}/{user.totalPredictions}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.accuracy.toFixed(1)}% précision
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

