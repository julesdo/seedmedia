"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

/**
 * Interface admin pour gérer les événements spéciaux et lancer les scripts
 * Accessible uniquement aux super admins
 */
export function AdminClient() {
  const isAdmin = useQuery(api.admin.isSuperAdmin);
  const dashboardStats = useQuery(api.admin.getDashboardStats, isAdmin ? {} : "skip");
  const recentActivity = useQuery(api.admin.getRecentActivity, isAdmin ? { limit: 10 } : "skip");
  const specialEventDecisions = useQuery(
    api.admin.getSpecialEventDecisions,
    isAdmin ? {} : "skip"
  );
  const runMunicipalesScript = useAction(api.scripts.createMunicipalesMarkets.createMunicipalesMarkets);
  const updateDecisionSpecialEvent = useMutation(api.admin.updateDecisionSpecialEvent);

  const [isRunningScript, setIsRunningScript] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    specialEvent: "" as "municipales_2026" | "presidentielles_2027" | "",
    region: "",
    city: "",
    eventCategory: "" as "blockbuster" | "tendance" | "insolite" | "",
  });

  if (isAdmin === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Vérification des permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Vous devez être un super administrateur pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleRunMunicipalesScript = async () => {
    if (!isAdmin) {
      toast.error("Vous devez être administrateur pour lancer ce script");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir lancer le script de création des marchés municipaux ?")) {
      return;
    }

    setIsRunningScript(true);
    try {
      const result = await runMunicipalesScript({});
      toast.success(`Script lancé avec succès ! ${result.created} marchés créés, ${result.failed} échecs.`);
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setIsRunningScript(false);
    }
  };

  const handleUpdateDecision = async (decisionId: string) => {
    try {
      await updateDecisionSpecialEvent({
        decisionId: decisionId as any,
        specialEvent: formData.specialEvent || undefined,
        specialEventMetadata: {
          region: formData.region || undefined,
          city: formData.city || undefined,
          eventCategory: formData.eventCategory || undefined,
        },
      });
      toast.success("Décision mise à jour avec succès");
      setSelectedDecision(null);
      setFormData({
        specialEvent: "",
        region: "",
        city: "",
        eventCategory: "",
      });
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    }
  };

  const municipalesDecisions = specialEventDecisions?.filter(
    (d) => d.specialEvent === "municipales_2026"
  ) || [];
  const presidentiellesDecisions = specialEventDecisions?.filter(
    (d) => d.specialEvent === "presidentielles_2027"
  ) || [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Panneau d'administration</h2>
        <p className="text-muted-foreground">
          Vue d'ensemble et gestion de l'application
        </p>
      </div>

      {/* KPIs */}
      {dashboardStats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Décisions totales</CardTitle>
              <SolarIcon icon="document-text-bold" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.decisions.total}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.decisions.tracking} en suivi, {dashboardStats.decisions.resolved} résolues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <SolarIcon icon="users-group-rounded-bold" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.users.total}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.users.activeLast7d} actifs (7j), +{dashboardStats.users.last7d} (7j)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liquidité totale</CardTitle>
              <SolarIcon icon="wallet-bold" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(dashboardStats.trading.totalLiquidity).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.trading.totalPools} pools actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume 24h</CardTitle>
              <SolarIcon icon="chart-2-bold" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(dashboardStats.trading.volume24h).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.trading.transactions24h} transactions
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Activité récente */}
      {recentActivity && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Décisions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.decisions.slice(0, 5).map((decision) => (
                  <div key={decision._id} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/decisions/${decision._id}`}
                      className="text-primary hover:underline truncate flex-1"
                    >
                      {decision.title}
                    </Link>
                    <Badge variant="outline" className="ml-2">
                      {decision.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Transactions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction._id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className={transaction.type === "buy" ? "text-green-600" : "text-red-600"}>
                        {transaction.type === "buy" ? "Achat" : "Vente"}
                      </span>
                      <span className="text-muted-foreground">
                        {transaction.shares} actions
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nouveaux utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.users.slice(0, 5).map((user) => (
                  <div key={user._id} className="text-sm">
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="events">Événements spéciaux</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques détaillées</CardTitle>
              <CardDescription>
                Vue d'ensemble des métriques principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardStats ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Décisions</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>Total : {dashboardStats.decisions.total}</li>
                      <li>En suivi : {dashboardStats.decisions.tracking}</li>
                      <li>Résolues : {dashboardStats.decisions.resolved}</li>
                      <li>+{dashboardStats.decisions.last24h} (24h)</li>
                      <li>+{dashboardStats.decisions.last7d} (7j)</li>
                      <li>+{dashboardStats.decisions.last30d} (30j)</li>
                      <li>Taux de résolution : {dashboardStats.resolutionRate}%</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Trading</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>Pools actifs : {dashboardStats.trading.totalPools}</li>
                      <li>Liquidité totale : {Math.round(dashboardStats.trading.totalLiquidity).toLocaleString()} Seeds</li>
                      <li>Volume 24h : {Math.round(dashboardStats.trading.volume24h).toLocaleString()} Seeds</li>
                      <li>Volume 7j : {Math.round(dashboardStats.trading.volume7d).toLocaleString()} Seeds</li>
                      <li>Transactions 24h : {dashboardStats.trading.transactions24h}</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scripts de création</CardTitle>
              <CardDescription>
                Lancer les scripts pour créer automatiquement des marchés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Municipales 2026</h3>
                <p className="text-sm text-muted-foreground">
                  Crée tous les marchés pour les élections municipales 2026
                </p>
                <Button
                  onClick={handleRunMunicipalesScript}
                  disabled={isRunningScript}
                  className="w-full sm:w-auto"
                >
                  {isRunningScript ? (
                    <>
                      <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                      Lancement en cours...
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="play-bold" className="size-4 mr-2" />
                      Lancer le script
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Événements spéciaux</CardTitle>
              <CardDescription>
                Gérer les décisions avec événements spéciaux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Municipales 2026 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-primary border-primary">
                      🗳️ Municipales 2026
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {municipalesDecisions.length} décisions
                    </span>
                  </div>
                  <div className="space-y-2">
                    {municipalesDecisions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucune décision municipale créée. Lancez le script pour en créer.
                      </p>
                    ) : (
                      municipalesDecisions.map((decision) => (
                        <div
                          key={decision._id}
                          className="p-4 border rounded-lg flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{decision.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {decision.question}
                            </p>
                            {decision.specialEventMetadata && (
                              <div className="flex gap-2 mt-2">
                                {decision.specialEventMetadata.city && (
                                  <Badge variant="secondary" className="text-xs">
                                    {decision.specialEventMetadata.city}
                                  </Badge>
                                )}
                                {decision.specialEventMetadata.eventCategory && (
                                  <Badge variant="outline" className="text-xs">
                                    {decision.specialEventMetadata.eventCategory}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDecision(decision._id);
                              setFormData({
                                specialEvent: decision.specialEvent || "",
                                region: decision.specialEventMetadata?.region || "",
                                city: decision.specialEventMetadata?.city || "",
                                eventCategory: decision.specialEventMetadata?.eventCategory || "",
                              });
                            }}
                          >
                            Modifier
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Présidentielles 2027 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-primary border-primary">
                      🏛️ Présidentielles 2027
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {presidentiellesDecisions.length} décisions
                    </span>
                  </div>
                  {presidentiellesDecisions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune décision présidentielle créée.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {presidentiellesDecisions.map((decision) => (
                        <div
                          key={decision._id}
                          className="p-4 border rounded-lg flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{decision.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {decision.question}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDecision(decision._id);
                              setFormData({
                                specialEvent: decision.specialEvent || "",
                                region: decision.specialEventMetadata?.region || "",
                                city: decision.specialEventMetadata?.city || "",
                                eventCategory: decision.specialEventMetadata?.eventCategory || "",
                              });
                            }}
                          >
                            Modifier
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de modification */}
      {selectedDecision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Modifier l'événement spécial</CardTitle>
              <CardDescription>
                Mettre à jour les métadonnées de l'événement spécial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Événement spécial</Label>
                <Select
                  value={formData.specialEvent}
                  onValueChange={(value) =>
                    setFormData({ ...formData, specialEvent: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un événement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="municipales_2026">Municipales 2026</SelectItem>
                    <SelectItem value="presidentielles_2027">Présidentielles 2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Région</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Ex: Île-de-France"
                />
              </div>

              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: Paris"
                />
              </div>

              <div className="space-y-2">
                <Label>Catégorie d'événement</Label>
                <Select
                  value={formData.eventCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventCategory: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blockbuster">Blockbuster</SelectItem>
                    <SelectItem value="tendance">Tendance</SelectItem>
                    <SelectItem value="insolite">Insolite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDecision(null);
                    setFormData({
                      specialEvent: "",
                      region: "",
                      city: "",
                      eventCategory: "",
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={() => handleUpdateDecision(selectedDecision)}>
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

