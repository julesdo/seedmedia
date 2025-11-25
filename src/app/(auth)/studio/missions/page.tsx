"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CredibilityGainBadge } from "@/components/credibility/CredibilityGainBadge";
import { useCredibilityPoints } from "@/hooks/useCredibilityPoints";

const CATEGORY_ICONS: Record<string, string> = {
  habit: "calendar-bold",
  discovery: "compass-bold",
  contribution: "hand-stars-bold",
};

const CATEGORY_COLORS: Record<string, string> = {
  habit: "text-blue-500",
  discovery: "text-green-500",
  contribution: "text-purple-500",
};

export default function MissionsPage() {
  const router = useRouter();
  const missions = useQuery(api.missions.getMissionsForUser);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const initializeMissions = useMutation(api.missions.initializeMissions);
  const credibilityPoints = useCredibilityPoints();

  // Initialiser les missions si elles n'existent pas
  useEffect(() => {
    if (missions !== undefined && missions.length === 0 && currentUser?._id) {
      initializeMissions()
        .then(() => {
          toast.success("Missions initialisées !");
        })
        .catch((error) => {
          console.error("Erreur initialisation missions:", error);
          toast.error("Erreur lors de l'initialisation des missions");
        });
    }
  }, [missions, currentUser, initializeMissions]);


  if (missions === undefined || currentUser === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Grouper les missions par catégorie
  const missionsByCategory = missions.reduce(
    (acc, mission) => {
      const category = mission.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(mission);
      return acc;
    },
    {} as Record<string, typeof missions>
  );

  const completedMissions = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;
  const overallProgress = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Missions & Progression</h1>
        <p className="text-muted-foreground mt-2">
          Complétez les missions pour débloquer de nouveaux niveaux et gagner des points de crédibilité
        </p>
      </div>

        {/* Progression missions */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Progression des missions</CardTitle>
            <CardDescription className="mt-1">
              Complétez les missions pour gagner des points de crédibilité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Missions complétées</span>
                <span className="font-medium">
                  {completedMissions} / {totalMissions}
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Missions par catégorie */}
        {Object.entries(missionsByCategory).map(([category, categoryMissions]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SolarIcon
                  icon={CATEGORY_ICONS[category] as any}
                  className={`h-5 w-5 ${CATEGORY_COLORS[category] || "text-muted-foreground"}`}
                />
                <CardTitle className="capitalize">
                  {category === "habit" && "Habitudes"}
                  {category === "discovery" && "Découverte"}
                  {category === "contribution" && "Contribution"}
                  {!["habit", "discovery", "contribution"].includes(category) && category}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryMissions.map((mission) => {
                  const progressPercent = (mission.progress / mission.target) * 100;
                  return (
                    <Card
                      key={mission._id}
                      className={cn(
                        "border-l-4 transition-all",
                        mission.completed
                          ? "border-l-green-500 bg-green-500/5"
                          : "border-l-primary/50 hover:border-l-primary"
                      )}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-base">{mission.title}</h3>
                              {mission.completed && (
                                <Badge variant="default" className="bg-green-500">
                                  <SolarIcon icon="check-circle-bold" className="h-3 w-3 mr-1" />
                                  Complétée
                                </Badge>
                              )}
                              {!mission.completed && (
                                <CredibilityGainBadge 
                                  points={credibilityPoints.missionCompleted || 2} 
                                  size="sm" 
                                />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{mission.description}</p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progression</span>
                                <span className="font-medium">
                                  {mission.progress} / {mission.target}
                                </span>
                              </div>
                              <Progress
                                value={progressPercent}
                                className={cn(
                                  "h-2",
                                  mission.completed && "bg-green-500/20"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Message si aucune mission */}
        {missions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <SolarIcon icon="rocket-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucune mission disponible pour le moment</p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

