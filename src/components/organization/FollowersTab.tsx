"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "next-view-transitions";

interface FollowersTabProps {
  organizationId: Id<"organizations">;
}

export function FollowersTab({ organizationId }: FollowersTabProps) {
  const followers = useQuery(api.follows.getOrganizationFollowers, { organizationId });

  if (followers === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SolarIcon icon="user-bold" className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Aucun abonné</EmptyTitle>
          <EmptyDescription>
            Cette organisation n'a pas encore d'abonnés.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {followers.map((follower) => (
        <Link
          key={follower._id}
          href={`/users/${follower._id}`}
          className="block"
        >
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={follower.image || undefined} alt={follower.name || follower.email} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light">
                    {follower.name?.[0]?.toUpperCase() || follower.email[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gradient-light truncate">
                      {follower.name || follower.email}
                    </p>
                    {follower.level && follower.level > 1 && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Niveau {follower.level}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <SolarIcon icon="star-bold" className="h-3 w-3" />
                    <span>{follower.credibilityScore || 0} crédibilité</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>
                      Suivi {formatDistanceToNow(new Date(follower.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

