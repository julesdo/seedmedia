"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Expert {
  _id: string;
  name: string;
  image?: string;
  credibilityScore?: number;
  role?: string;
  expertiseDomains?: string[];
}

interface TopExpertsWidgetProps {
  experts?: Expert[];
}

export function TopExpertsWidget({ experts = [] }: TopExpertsWidgetProps) {
  if (experts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SolarIcon icon="star-bold" className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg text-gradient-light">Top Experts</CardTitle>
        </div>
        <CardDescription>Les contributeurs les plus crédibles</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {experts.map((expert, index) => (
              <Link
                key={expert._id}
                href={`/experts/${expert._id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={expert.image || undefined} />
                    <AvatarFallback>
                      {expert.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {expert.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {expert.credibilityScore !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                        {expert.credibilityScore}
                      </Badge>
                    )}
                    {expert.expertiseDomains && expert.expertiseDomains.length > 0 && (
                      <span className="text-xs text-muted-foreground truncate">
                        {expert.expertiseDomains[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

