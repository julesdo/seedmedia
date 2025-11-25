"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "next-view-transitions";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Progress } from "@/components/ui/progress";

interface Debat {
  _id: string;
  question: string;
  slug: string;
  argumentsForCount: number;
  argumentsAgainstCount: number;
  polarizationScore: number;
}

interface HomeDebatsProps {
  debats: Debat[];
}

export function HomeDebats({ debats }: HomeDebatsProps) {
  if (debats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun débat ouvert pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {debats.map((debat) => {
        const total = debat.argumentsForCount + debat.argumentsAgainstCount;
        const forPercentage = total > 0 ? (debat.argumentsForCount / total) * 100 : 50;

        return (
          <Card key={debat._id} className="group border-l-4 border-transparent hover:border-primary transition-colors">
            <Link href={`/debats/${debat.slug}`}>
              <CardHeader>
                <CardTitle className="line-clamp-2 group-hover:opacity-80 transition-opacity">
                  {debat.question}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <SolarIcon icon="chat-round-bold" className="h-3 w-3" />
                    {total} arguments
                  </span>
                  <Badge variant={debat.polarizationScore > 70 ? "destructive" : "secondary"}>
                    Polarisation: {debat.polarizationScore}%
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Pour ({debat.argumentsForCount})
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Contre ({debat.argumentsAgainstCount})
                    </span>
                  </div>
                  <Progress value={forPercentage} className="h-2" />
                </div>
              </CardContent>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}

