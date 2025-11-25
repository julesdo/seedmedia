"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "next-view-transitions";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";

interface Expert {
  _id: string;
  name: string;
  image?: string;
  credibilityScore: number;
  domain: string;
  articlesCount: number;
}

interface HomeTopExpertsProps {
  experts: Expert[];
}

export function HomeTopExperts({ experts }: HomeTopExpertsProps) {
  if (experts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun expert pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {experts.map((expert) => (
        <Card key={expert._id} className="group border border-transparent hover:border-primary transition-colors text-center">
          <Link href={`/experts/${expert._id}`}>
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                  <AvatarImage src={expert.image || undefined} />
                  <AvatarFallback className="text-lg font-semibold">
                    {expert.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm line-clamp-1">{expert.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {expert.domain}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <SolarIcon icon="star-bold" className="h-3 w-3" />
                  <span>{expert.credibilityScore}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {expert.articlesCount} articles
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}

