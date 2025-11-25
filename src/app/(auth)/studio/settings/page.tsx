"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("seed_active_accounts");
      if (stored) {
        try {
          setStoredAccounts(JSON.parse(stored));
        } catch (error) {
          console.error("Failed to parse stored accounts:", error);
        }
      }
    }
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
      setIsLoading(false);
    }
  };

  const getProviderLabel = (provider?: string) => {
    if (provider === "github") return "GitHub";
    if (provider === "google") return "Google";
    return "Email";
  };

  const uniqueAccountsByEmail = new Map();
  storedAccounts.forEach((account) => {
    if (!uniqueAccountsByEmail.has(account.email)) {
      uniqueAccountsByEmail.set(account.email, account);
    }
  });
  const uniqueAccounts = Array.from(uniqueAccountsByEmail.values());

  if (user === undefined) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  if (user === null) {
    return <div className="flex items-center justify-center h-full">Non authentifié</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos préférences et vos paramètres de compte
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Compte</CardTitle>
            <CardDescription>Informations de votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email || ""} disabled className="opacity-70" />
              <p className="text-xs text-muted-foreground opacity-70">
                L'email ne peut pas être modifié pour le moment
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={user.name || "Non défini"} disabled className="opacity-70" />
              <p className="text-xs text-muted-foreground opacity-70">
                Le nom est géré par Better Auth
              </p>
            </div>
            <div className="pt-2">
              <Link href="/studio/profile">
                <Button variant="outline" size="sm" className="w-full">
                  <SolarIcon icon="user-bold" className="h-4 w-4 mr-2" />
                  Voir mon profil complet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comptes connectés</CardTitle>
                <CardDescription>Gérez vos comptes liés (OAuth, Email)</CardDescription>
              </div>
              <Link href="/studio/accounts">
                <Button variant="outline" size="sm">
                  <SolarIcon icon="settings-bold" className="h-4 w-4 mr-2" />
                  Gérer
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {uniqueAccounts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground opacity-70">
                <p className="text-sm">Aucun compte connecté</p>
                <Link href="/studio/accounts">
                  <Button variant="outline" size="sm" className="mt-2">
                    <SolarIcon icon="user-plus-bold" className="h-4 w-4 mr-2" />
                    Ajouter un compte
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {uniqueAccounts.slice(0, 3).map((account: any) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={account.image || undefined} alt={account.name || ""} />
                        <AvatarFallback className="text-xs">
                          {account.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {account.name || account.email}
                        </div>
                        <div className="text-xs text-muted-foreground opacity-70">
                          {account.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getProviderLabel(account.provider)}
                    </Badge>
                  </div>
                ))}
                {uniqueAccounts.length > 3 && (
                  <Link href="/studio/accounts">
                    <Button variant="outline" size="sm" className="w-full">
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 mr-2" />
                      Voir tous les comptes ({uniqueAccounts.length})
                    </Button>
                  </Link>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>Gérez la sécurité de votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
              <div className="flex items-center gap-3">
                <SolarIcon icon="lock-password-bold" className="h-5 w-5" />
                <div>
                  <div className="font-medium">Authentification à deux facteurs</div>
                  <div className="text-sm text-muted-foreground opacity-70">
                    Ajoutez une couche de sécurité supplémentaire
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configurer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Préférences</CardTitle>
            <CardDescription>Personnalisez votre expérience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
              <div className="flex items-center gap-3 flex-1">
                <SolarIcon icon="bell-bold" className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">Notifications email</div>
                  <div className="text-sm text-muted-foreground opacity-70">
                    Recevoir des notifications par email
                  </div>
                </div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
              <div className="flex items-center gap-3 flex-1">
                <SolarIcon icon="bell-ringing-bold" className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">Notifications push</div>
                  <div className="text-sm text-muted-foreground opacity-70">
                    Recevoir des notifications push (bientôt disponible)
                  </div>
                </div>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, push: checked })
                }
                disabled
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
              <div className="flex items-center gap-3 flex-1">
                <SolarIcon icon="mailbox-bold" className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">Emails marketing</div>
                  <div className="text-sm text-muted-foreground opacity-70">
                    Recevoir des emails promotionnels et des actualités
                  </div>
                </div>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, marketing: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
            <CardDescription>Personnalisez l'apparence de l'application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50">
              <div className="flex items-center gap-3">
                <SolarIcon icon="palette-bold" className="h-5 w-5" />
                <div>
                  <div className="font-medium">Thème</div>
                  <div className="text-sm text-muted-foreground opacity-70">
                    Choisissez entre clair, sombre ou automatique
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configurer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
            <CardDescription>Actions irréversibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-destructive/50">
              <div className="flex items-center gap-3">
                <SolarIcon icon="logout-2-bold" className="h-5 w-5 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Déconnexion</div>
                  <div className="text-sm text-muted-foreground opacity-70">
                    Déconnectez-vous de votre compte
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoading}
              >
                <SolarIcon icon="logout-2-bold" className="h-4 w-4 mr-2" />
                {isLoading ? "Déconnexion..." : "Déconnexion"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

