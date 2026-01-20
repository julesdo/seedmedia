"use client";

import { useUser } from "@/contexts/UserContext";
import { AllRegionsRanking } from "@/components/municipales/AllRegionsRanking";
import { RegionRanking } from "@/components/municipales/RegionRanking";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SolarIcon } from "@/components/icons/SolarIcon";

export default function MunicipalesPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🗳️ Municipales 2026</h1>
        <p className="text-muted-foreground">
          Participez à la "Bataille des Régions" et défiez les autres régions !
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche ?</CardTitle>
          <CardDescription>
            Rejoignez votre région et faites des prédictions sur les municipales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <SolarIcon icon="user-plus-bold" className="size-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">1. Choisissez votre région</div>
                <div className="text-sm text-muted-foreground">
                  Allez dans les paramètres et sélectionnez votre région
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <SolarIcon icon="chart-2-bold" className="size-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">2. Faites des prédictions</div>
                <div className="text-sm text-muted-foreground">
                  Pariez sur les marchés municipales avec vos Seeds
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <SolarIcon icon="trophy-bold" className="size-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">3. Montez dans le classement</div>
                <div className="text-sm text-muted-foreground">
                  Gagnez des points en faisant des prédictions correctes
                </div>
              </div>
            </div>
          </div>
          {!user?.municipales2026?.selectedRegion && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold mb-1">Rejoignez votre région !</div>
                  <div className="text-sm text-muted-foreground">
                    Choisissez votre région dans les paramètres pour participer au classement
                  </div>
                </div>
                <Button asChild>
                  <Link href="/settings">
                    <SolarIcon icon="settings-bold" className="size-4 mr-2" />
                    Aller aux paramètres
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classement de la région de l'utilisateur */}
      {user?.municipales2026?.selectedRegion && (
        <RegionRanking region={user.municipales2026.selectedRegion} limit={10} />
      )}

      {/* Classement de toutes les régions */}
      <AllRegionsRanking />

      {/* Lien vers les marchés municipales */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Voir tous les marchés</CardTitle>
          <CardDescription>
            Découvrez tous les marchés municipales disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/anticipations?specialEvent=municipales_2026">
              <SolarIcon icon="chart-2-bold" className="size-4 mr-2" />
              Voir les marchés municipales
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

