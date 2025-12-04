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
  const missions = useQuery(api.missions.getMissionsForUser);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const levelInfo = useQuery(api.missions.getLevelInfo);
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
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
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

  // Missions actives (non complétées)
  const activeMissions = missions.filter((m) => !m.completed);
  const activeMissionsByCategory = activeMissions.reduce(
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

  // Missions complétées
  const completedMissionsList = missions.filter((m) => m.completed);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Missions & Progression</h1>
          <p className="text-sm text-muted-foreground">
            Complétez les missions pour débloquer de nouveaux niveaux et gagner des points de crédibilité
          </p>
        </div>

        {/* Stats et niveau */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progression globale */}
          <Card className="border border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missions complétées</CardTitle>
              <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedMissions} / {totalMissions}
              </div>
              <Progress value={overallProgress} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {overallProgress.toFixed(0)}% complété
              </p>
            </CardContent>
          </Card>

          {/* Niveau actuel */}
          <Card className="border border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Niveau actuel</CardTitle>
              <SolarIcon icon="star-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {levelInfo?.currentLevel || 1}
              </div>
              {levelInfo && levelInfo.nextLevel && levelInfo.nextLevelThreshold && (
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.max(0, levelInfo.nextLevelThreshold - (levelInfo.credibilityScore || 0))} points jusqu'au niveau {levelInfo.nextLevel}
                </p>
              )}
              {levelInfo && !levelInfo.nextLevel && (
                <p className="text-xs text-muted-foreground mt-2">
                  Niveau maximum atteint
                </p>
              )}
            </CardContent>
          </Card>

          {/* Points de crédibilité */}
          <Card className="border border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de crédibilité</CardTitle>
              <SolarIcon icon="star-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentUser.credibilityScore || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Points de crédibilité
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Missions actives par catégorie */}
        {Object.keys(activeMissionsByCategory).length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Missions en cours</h2>
              <p className="text-sm text-muted-foreground">
                Complétez ces missions pour gagner des points de crédibilité
              </p>
            </div>
            {Object.entries(activeMissionsByCategory).map(([category, categoryMissions]) => (
              <Card key={category} className="border border-border/60 bg-card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <SolarIcon
                      icon={CATEGORY_ICONS[category] as any}
                      className={cn("h-5 w-5", CATEGORY_COLORS[category] || "text-muted-foreground")}
                    />
                    <CardTitle className="capitalize">
                      {category === "habit" && "Habitudes"}
                      {category === "discovery" && "Découverte"}
                      {category === "contribution" && "Contribution"}
                      {category === "engagement" && "Engagement"}
                      {!["habit", "discovery", "contribution", "engagement"].includes(category) && category}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                      {categoryMissions.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryMissions.map((mission) => {
                      const progressPercent = (mission.progress / mission.target) * 100;
                      return (
                        <div
                          key={mission._id}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            "border-border/60 hover:border-border/80 bg-card"
                          )}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-base">{mission.title}</h3>
                                  <CredibilityGainBadge 
                                    points={credibilityPoints.missionCompleted || 2} 
                                    size="sm" 
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">{mission.description}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progression</span>
                                <span className="font-medium">
                                  {mission.progress} / {mission.target}
                                </span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Missions complétées */}
        {completedMissionsList.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Missions complétées</h2>
              <p className="text-sm text-muted-foreground">
                {completedMissionsList.length} mission{completedMissionsList.length > 1 ? "s" : ""} terminée{completedMissionsList.length > 1 ? "s" : ""}
              </p>
            </div>
            <Card className="border border-border/60 bg-card">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedMissionsList.map((mission) => (
                    <div
                      key={mission._id}
                      className="p-4 rounded-lg border border-green-500/20 bg-green-500/5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-500 shrink-0" />
                            <h3 className="font-medium text-sm line-clamp-2">{mission.title}</h3>
                          </div>
                          {mission.completedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Complétée le {new Date(mission.completedAt).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message si aucune mission */}
        {missions.length === 0 && (
          <Card className="border border-border/60 bg-card">
            <CardContent className="py-12 text-center">
              <SolarIcon icon="rocket-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Aucune mission disponible pour le moment</p>
              <Button
                onClick={() => initializeMissions()}
                className="mt-4"
                variant="outline"
              >
                Initialiser les missions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

