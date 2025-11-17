"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StoredAccount {
  id: string;
  email: string;
  name: string;
  image: string | null;
  provider?: string;
  addedAt: number;
}

const STORAGE_KEY = "seed_active_accounts";
const CURRENT_ACCOUNT_KEY = "seed_current_account_id";

export default function AccountsPage() {
  const router = useRouter();
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [accountToRemove, setAccountToRemove] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadAccounts = () => {
      const currentId = localStorage.getItem(CURRENT_ACCOUNT_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      let parsedAccounts: StoredAccount[] = [];
      
      if (stored) {
        try {
          parsedAccounts = JSON.parse(stored) as StoredAccount[];
        } catch (error) {
          console.error("Failed to parse stored accounts:", error);
        }
      }

      setStoredAccounts(parsedAccounts);
      setCurrentAccountId(currentId);
    };

    loadAccounts();

    // Écouter les changements de localStorage
    const handleStorageChange = () => loadAccounts();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("accountsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("accountsUpdated", handleStorageChange);
    };
  }, []);

  const handleSwitchAccount = async (accountId: string) => {
    const account = storedAccounts.find((acc) => acc.id === accountId);
    if (!account) {
      toast.error("Compte introuvable");
      return;
    }

    if (currentAccountId === accountId) {
      toast.info("Ce compte est déjà actif");
      return;
    }

    // Détecter le provider
    let detectedProvider = account.provider;
    if (!detectedProvider || detectedProvider === "email" || detectedProvider === "unknown") {
      const accountWithSameEmail = storedAccounts.find(
        (acc) => acc.email === account.email && acc.provider && (acc.provider === "github" || acc.provider === "google")
      );
      if (accountWithSameEmail?.provider) {
        detectedProvider = accountWithSameEmail.provider;
      } else {
        detectedProvider = "email";
      }
    }

    localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId);
    localStorage.setItem("pending_account_switch", accountId);

    try {
      await authClient.signOut();
      const redirectUrl = `/sign-in?switch_to_account=${encodeURIComponent(account.email)}&provider=${detectedProvider}&auto_reconnect=true`;
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 200);
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erreur lors du changement de compte");
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (accountId === currentAccountId) {
      toast.error("Vous ne pouvez pas supprimer le compte actuellement actif");
      return;
    }

    const updatedAccounts = storedAccounts.filter((acc) => acc.id !== accountId);
    setStoredAccounts(updatedAccounts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
    window.dispatchEvent(new Event("accountsUpdated"));
    toast.success("Compte supprimé");
    setAccountToRemove(null);
  };

  const handleAddAccount = () => {
    setIsAddingAccount(true);
    const popup = window.open(
      "/sign-in?add_account=true",
      "addAccount",
      "width=500,height=700,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      toast.error("Veuillez autoriser les popups pour ajouter un compte");
      setIsAddingAccount(false);
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "ACCOUNT_ADDED" && event.data.account) {
        const newAccount: StoredAccount = {
          id: `account-${Date.now()}`,
          email: event.data.account.email,
          name: event.data.account.name || event.data.account.email.split("@")[0],
          image: event.data.account.image || null,
          provider: event.data.account.provider || "unknown",
          addedAt: Date.now(),
        };

        const existingAccount = storedAccounts.find((acc) => acc.email === newAccount.email);
        if (existingAccount) {
          // Mettre à jour le provider si nécessaire
          if (newAccount.provider && (newAccount.provider === "github" || newAccount.provider === "google")) {
            if (!existingAccount.provider || existingAccount.provider === "email" || existingAccount.provider === "unknown") {
              existingAccount.provider = newAccount.provider;
              const updatedAccounts = storedAccounts.map((acc) =>
                acc.id === existingAccount.id ? existingAccount : acc
              );
              setStoredAccounts(updatedAccounts);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
            }
          }
          toast.info("Ce compte est déjà lié");
        } else {
          const updatedAccounts = [...storedAccounts, newAccount];
          setStoredAccounts(updatedAccounts);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
          toast.success("Compte ajouté avec succès");
        }

        window.dispatchEvent(new Event("accountsUpdated"));
        window.removeEventListener("message", handleMessage);
        popup?.close();
        setIsAddingAccount(false);
      }
    };

    window.addEventListener("message", handleMessage);

    // Nettoyer si la popup est fermée manuellement
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        setIsAddingAccount(false);
      }
    }, 500);
  };

  // Regrouper les comptes par email (un seul compte par email)
  const uniqueAccountsByEmail = new Map<string, StoredAccount>();
  storedAccounts.forEach((account) => {
    if (!uniqueAccountsByEmail.has(account.email)) {
      uniqueAccountsByEmail.set(account.email, account);
    }
  });
  const uniqueAccounts = Array.from(uniqueAccountsByEmail.values());

  const getProviderIcon = (provider?: string) => {
    if (provider === "github") return "github-bold";
    if (provider === "google") return "google-bold";
    return "email-bold";
  };

  const getProviderLabel = (provider?: string) => {
    if (provider === "github") return "GitHub";
    if (provider === "google") return "Google";
    return "Email";
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-light mb-2">Gestion des comptes</h1>
          <p className="text-muted-foreground opacity-70">
            Gérez vos comptes connectés et basculez entre eux facilement
          </p>
        </div>
        <Button
          variant="accent"
          onClick={handleAddAccount}
          disabled={isAddingAccount}
          icon="user-plus-bold"
        >
          {isAddingAccount ? "Ajout en cours..." : "Ajouter un compte"}
        </Button>
      </div>

      {uniqueAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SolarIcon
              icon="user-id-bold"
              className="h-16 w-16 icon-gradient-light opacity-50 mb-4"
            />
            <h3 className="text-xl font-semibold text-gradient-light mb-2">
              Aucun compte
            </h3>
            <p className="text-muted-foreground opacity-70 text-center mb-6 max-w-md">
              Ajoutez votre premier compte pour commencer. Vous pouvez connecter plusieurs comptes
              (GitHub, Google, Email) et basculer entre eux facilement.
            </p>
            <Button variant="accent" onClick={handleAddAccount} icon="user-plus-bold">
              Ajouter un compte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {uniqueAccounts.map((account) => {
            const isCurrent = account.id === currentAccountId;
            return (
              <Card
                key={account.id}
                className={`relative transition-all ${
                  isCurrent
                    ? "ring-2 ring-primary/50 bg-primary/5"
                    : "hover:scale-[1.02] hover:shadow-lg"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-border/50">
                      <AvatarImage src={account.image || undefined} alt={account.name || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-lg">
                        {account.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-gradient-light truncate">
                          {account.name || account.email}
                        </CardTitle>
                        {isCurrent && (
                          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                            Actif
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="truncate">{account.email}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <SolarIcon
                          icon={getProviderIcon(account.provider)}
                          className="h-4 w-4 icon-gradient-light"
                        />
                        <span className="text-xs text-muted-foreground">
                          {getProviderLabel(account.provider)}
                        </span>
                        <span className="text-xs text-muted-foreground opacity-50">•</span>
                        <span className="text-xs text-muted-foreground">
                          Ajouté le {new Date(account.addedAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {!isCurrent && (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleSwitchAccount(account.id)}
                        className="flex-1"
                        icon="swap-bold"
                      >
                        Activer ce compte
                      </Button>
                    )}
                    {!isCurrent && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setAccountToRemove(account.id)}
                        icon="trash-bin-minimalistic-bold"
                      >
                        Supprimer
                      </Button>
                    )}
                    {isCurrent && (
                      <div className="flex-1 text-sm text-muted-foreground text-center py-2">
                        Ce compte est actuellement actif
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={accountToRemove !== null} onOpenChange={(open) => !open && setAccountToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-light">Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le compte de votre liste. Vous pourrez toujours le reconnecter plus tard.
              Cette action n'est pas irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => accountToRemove && handleRemoveAccount(accountToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

