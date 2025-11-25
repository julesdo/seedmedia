"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";

interface TrendingTopicsWidgetProps {
  topics?: string[];
}

export function TrendingTopicsWidget({ topics = [] }: TrendingTopicsWidgetProps) {
  const defaultTopics = [
    "Résilience technologique",
    "IA éthique",
    "Open source",
    "Gouvernance",
    "Débats",
    "Fact-checking",
  ];

  const displayTopics = topics.length > 0 ? topics : defaultTopics;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SolarIcon icon="fire-bold" className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg text-gradient-light">Tendances</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {displayTopics.map((topic, index) => (
            <Link
              key={index}
              href={`/articles?tag=${encodeURIComponent(topic)}`}
            >
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {topic}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

