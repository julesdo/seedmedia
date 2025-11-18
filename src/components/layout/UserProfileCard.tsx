"use client";

import React from "react";
import { useTransitionRouter } from "next-view-transitions";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { Link } from "next-view-transitions";
import { Id } from "../../../convex/_generated/dataModel";

interface UserProfileCardProps {
  user?: {
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
  accounts?: Array<{
    id: Id<"userAccounts">;
    name: string;
    email: string;
    image?: string | null;
    type?: "personal" | "professional" | "organization";
    isDefault?: boolean;
  }>;
}

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

export function UserProfileCard({ user, accounts = [] }: UserProfileCardProps) {
  const router = useTransitionRouter();
  const organizations = useQuery(api.organizations.getUserOrganizations);
  const [storedAccounts, setStoredAccounts] = React.useState<StoredAccount[]>([]);
  const [currentAccountId, setCurrentAccountId] = React.useState<string | null>(null);

  // Charger les comptes depuis localStorage au montage et écouter les changements
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const loadAccounts = () => {
      // Charger le compte actuel EN PREMIER pour éviter qu'il soit écrasé
      const currentId = localStorage.getItem(CURRENT_ACCOUNT_KEY);
      
      // Charger les comptes stockés
      const stored = localStorage.getItem(STORAGE_KEY);
      let parsedAccounts: StoredAccount[] = [];
      if (stored) {
        try {
          parsedAccounts = JSON.parse(stored) as StoredAccount[];
          setStoredAccounts(parsedAccounts);
          console.log("UserProfileCard: Loaded accounts from localStorage", parsedAccounts.length);
        } catch (error) {
          console.error("Failed to parse stored accounts:", error);
        }
      } else {
        console.log("UserProfileCard: No accounts found in localStorage");
      }

      // Définir le compte actuel (ne pas l'écraser si déjà défini)
      if (currentId) {
        setCurrentAccountId(currentId);
        console.log("UserProfileCard: Loaded current account ID", currentId);
      } else {
        console.log("UserProfileCard: No current account ID in localStorage");
      }

      // Si l'utilisateur actuel n'est pas dans la liste, l'ajouter
      // MAIS ne JAMAIS le définir comme compte actuel si un compte est déjà sélectionné
      // Note: On ne peut pas détecter le provider depuis Better Auth directement,
      // donc on ajoute le compte seulement s'il n'existe pas déjà avec le même email
      // (même si le provider pourrait être différent, on ne peut pas le savoir ici)
      if (user && user.email) {
        // Chercher un compte avec le même email (sans vérifier le provider car on ne le connaît pas)
        const existingAccount = parsedAccounts.find((acc) => acc.email === user.email);
        if (!existingAccount) {
          // Vérifier si on peut détecter le provider depuis localStorage (pour les connexions OAuth récentes)
          // Le callback devrait avoir créé le compte avec le bon provider, mais si ce n'est pas le cas,
          // on essaie de le détecter depuis pendingOAuthProvider ou sessionStorage
          let detectedProvider = "email"; // Par défaut
          const pendingProvider = typeof window !== "undefined" ? localStorage.getItem("pendingOAuthProvider") : null;
          const sessionProvider = typeof window !== "undefined" ? sessionStorage.getItem("oauthProvider") : null;
          
          if (pendingProvider && (pendingProvider === "github" || pendingProvider === "google")) {
            detectedProvider = pendingProvider;
          } else if (sessionProvider && (sessionProvider === "github" || sessionProvider === "google")) {
            detectedProvider = sessionProvider;
          }
          
          const newAccount: StoredAccount = {
            id: `account-${Date.now()}`,
            email: user.email,
            name: user.name || user.email.split("@")[0] || "Utilisateur",
            image: user.image || null,
            provider: detectedProvider,
            addedAt: Date.now(),
          };
          const updatedAccounts = [...parsedAccounts, newAccount];
          setStoredAccounts(updatedAccounts);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
          
          // Définir comme compte actuel SEULEMENT si aucun compte n'est déjà défini
          // et si c'est le premier compte ajouté
          if (!currentId && parsedAccounts.length === 0) {
            setCurrentAccountId(newAccount.id);
            localStorage.setItem(CURRENT_ACCOUNT_KEY, newAccount.id);
          }
        } else {
          // Si le compte existe déjà mais a provider "email" ou "unknown",
          // essayer de détecter le provider depuis localStorage/sessionStorage
          if (existingAccount.provider === "email" || existingAccount.provider === "unknown" || !existingAccount.provider) {
            const pendingProvider = typeof window !== "undefined" ? localStorage.getItem("pendingOAuthProvider") : null;
            const sessionProvider = typeof window !== "undefined" ? sessionStorage.getItem("oauthProvider") : null;
            
            if (pendingProvider && (pendingProvider === "github" || pendingProvider === "google")) {
              existingAccount.provider = pendingProvider;
              const updatedAccounts = parsedAccounts.map(acc =>
                acc.id === existingAccount.id ? existingAccount : acc
              );
              setStoredAccounts(updatedAccounts);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
            } else if (sessionProvider && (sessionProvider === "github" || sessionProvider === "google")) {
              existingAccount.provider = sessionProvider;
              const updatedAccounts = parsedAccounts.map(acc =>
                acc.id === existingAccount.id ? existingAccount : acc
              );
              setStoredAccounts(updatedAccounts);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
            }
          }
          
          // Si le compte existe déjà, vérifier s'il doit être défini comme actuel
          // Seulement si aucun compte actuel n'est défini
          if (!currentId) {
            setCurrentAccountId(existingAccount.id);
            localStorage.setItem(CURRENT_ACCOUNT_KEY, existingAccount.id);
          }
        }
      }
    };

    loadAccounts();

    // Écouter les changements de localStorage (quand un compte est ajouté depuis une autre fenêtre)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === CURRENT_ACCOUNT_KEY) {
        console.log("UserProfileCard: Storage event detected, reloading accounts");
        loadAccounts();
      }
    };

    // Écouter les événements personnalisés (quand un compte est ajouté dans la même fenêtre)
    const handleAccountsUpdated = () => {
      console.log("UserProfileCard: accountsUpdated event detected, reloading accounts");
      loadAccounts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('accountsUpdated', handleAccountsUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('accountsUpdated', handleAccountsUpdated);
    };
  }, [user]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const handleAddAccount = () => {
    // Marquer dans sessionStorage que c'est pour ajouter un compte
    if (typeof window !== "undefined") {
      sessionStorage.setItem("addingAccount", "true");
    }
    
    // Ouvrir une nouvelle fenêtre pour se connecter avec un autre compte
    const signInUrl = `/sign-in?prompt=select_account&add_account=true`;
    const popup = window.open(
      signInUrl,
      "addAccount",
      "width=500,height=600,left=100,top=100"
    );

    if (!popup) {
      alert("Veuillez autoriser les popups pour ajouter un compte");
      return;
    }

    // Écouter les messages depuis la popup pour ajouter le compte
    const handleMessage = (event: MessageEvent) => {
      console.log("UserProfileCard: Message received", { 
        origin: event.origin, 
        type: event.data.type,
        hasAccount: !!event.data.account
      });
      
      // Vérifier l'origine pour la sécurité
      if (event.origin !== window.location.origin) {
        console.log("UserProfileCard: Origin mismatch", event.origin, window.location.origin);
        return;
      }

      if (event.data.type === "ACCOUNT_ADDED" && event.data.account) {
        console.log("UserProfileCard: Account added:", event.data.account);
        
        // Charger les comptes actuels depuis localStorage pour être sûr d'avoir la dernière version
        const stored = localStorage.getItem(STORAGE_KEY);
        let currentStoredAccounts: StoredAccount[] = [];
        if (stored) {
          try {
            currentStoredAccounts = JSON.parse(stored) as StoredAccount[];
          } catch (error) {
            console.error("Failed to parse stored accounts:", error);
          }
        }
        
        // Si le provider n'est pas défini dans le message, essayer de le récupérer depuis localStorage
        let accountProvider = event.data.account.provider;
        if (!accountProvider || accountProvider === "unknown" || accountProvider === "email") {
          const pendingProvider = typeof window !== "undefined" ? 
            (localStorage.getItem("pendingOAuthProvider") || sessionStorage.getItem("oauthProvider")) : null;
          if (pendingProvider && (pendingProvider === "github" || pendingProvider === "google")) {
            accountProvider = pendingProvider;
          }
        }
        
        const newAccount: StoredAccount = {
          id: `account-${Date.now()}`,
          email: event.data.account.email,
          name: event.data.account.name || event.data.account.email.split("@")[0],
          image: event.data.account.image || null,
          provider: accountProvider || "unknown",
          addedAt: Date.now(),
        };
        
        // Vérifier si un compte avec le même email existe déjà
        // Better Auth lie automatiquement les comptes avec le même email, donc on regroupe en un seul compte
        const existingAccount = currentStoredAccounts.find((acc) => acc.email === newAccount.email);
        
        if (existingAccount) {
          // TOUJOURS mettre à jour le provider si le nouveau compte a un provider OAuth valide
          // Cela garantit que le provider est correctement stocké même si le compte existait déjà
          let shouldUpdate = false;
          if (newAccount.provider && (newAccount.provider === "github" || newAccount.provider === "google")) {
            // Mettre à jour si le compte existant n'a pas de provider ou a un provider moins spécifique
            if (!existingAccount.provider || 
                existingAccount.provider === "email" || 
                existingAccount.provider === "unknown" ||
                (existingAccount.provider !== "github" && existingAccount.provider !== "google")) {
              existingAccount.provider = newAccount.provider;
              shouldUpdate = true;
            }
          }
          
          // Mettre à jour aussi les autres champs si nécessaire (name, image)
          if (newAccount.name && newAccount.name !== existingAccount.name) {
            existingAccount.name = newAccount.name;
            shouldUpdate = true;
          }
          if (newAccount.image && newAccount.image !== existingAccount.image) {
            existingAccount.image = newAccount.image;
            shouldUpdate = true;
          }
          
          // Sauvegarder les modifications si nécessaire
          if (shouldUpdate) {
            const updatedAccounts = currentStoredAccounts.map(acc => 
              acc.id === existingAccount.id ? existingAccount : acc
            );
            setStoredAccounts(updatedAccounts);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
          }
          
          // Si le compte existe déjà (même email), basculer vers lui
          // On ne crée pas de doublon car Better Auth lie automatiquement les comptes
          setCurrentAccountId(existingAccount.id);
          localStorage.setItem(CURRENT_ACCOUNT_KEY, existingAccount.id);
          // Recharger les comptes depuis localStorage
          setStoredAccounts(currentStoredAccounts);
          // Forcer un re-render
          window.dispatchEvent(new Event('accountsUpdated'));
          window.removeEventListener("message", handleMessage);
          try {
            popup?.close();
          } catch (error) {
            // Ignorer les erreurs COOP
          }
          return;
        }
        
        // Si aucun compte avec cet email n'existe, ajouter le nouveau compte
        const updatedAccounts = [...currentStoredAccounts, newAccount];
        console.log("UserProfileCard: Updated accounts list (before save)", updatedAccounts);
        
        // Sauvegarder dans localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
        console.log("UserProfileCard: Saved accounts to localStorage", STORAGE_KEY, updatedAccounts.length);
        
        // Mettre à jour le state
        setStoredAccounts(updatedAccounts);
        console.log("UserProfileCard: Updated state with accounts", updatedAccounts.length);
        
        // Basculer vers le nouveau compte
        setCurrentAccountId(newAccount.id);
        localStorage.setItem(CURRENT_ACCOUNT_KEY, newAccount.id);
        console.log("UserProfileCard: Set current account ID", newAccount.id);
        
        // Vérifier que les données sont bien sauvegardées
        const verifyStored = localStorage.getItem(STORAGE_KEY);
        const verifyCurrent = localStorage.getItem(CURRENT_ACCOUNT_KEY);
        console.log("UserProfileCard: Verification - stored accounts:", verifyStored ? JSON.parse(verifyStored).length : 0, "current ID:", verifyCurrent);
        
        // Forcer un re-render en déclenchant un événement personnalisé
        window.dispatchEvent(new Event('accountsUpdated'));
        console.log("UserProfileCard: Dispatched accountsUpdated event");
        
        window.removeEventListener("message", handleMessage);
        try {
          popup?.close();
        } catch (error) {
          // Ignorer les erreurs COOP
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Nettoyer le listener après 5 minutes (timeout de sécurité)
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      try {
        if (popup && !popup.closed) {
          popup.close();
        }
      } catch (error) {
        // Ignorer les erreurs COOP
      }
    }, 5 * 60 * 1000);

    // Nettoyer aussi si la popup est fermée manuellement
    const checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          window.removeEventListener("message", handleMessage);
          clearInterval(checkPopup);
          clearTimeout(timeout);
        }
      } catch (error) {
        // Ignorer les erreurs COOP (Cross-Origin-Opener-Policy)
        // La popup sera fermée automatiquement après le timeout
      }
    }, 1000);
  };

  const handleRemoveAccount = (accountId: string) => {
    const updatedAccounts = storedAccounts.filter((acc) => acc.id !== accountId);
    setStoredAccounts(updatedAccounts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));

    // Si on supprime le compte actuel, basculer vers le premier disponible
    if (currentAccountId === accountId) {
      if (updatedAccounts.length > 0) {
        const newCurrent = updatedAccounts[0].id;
        setCurrentAccountId(newCurrent);
        localStorage.setItem(CURRENT_ACCOUNT_KEY, newCurrent);
        window.location.reload();
      } else {
        // Plus de comptes, déconnexion
        handleSignOut();
      }
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    const account = storedAccounts.find((acc) => acc.id === accountId);
    if (!account) {
      console.error("UserProfileCard: Account not found", accountId);
      return;
    }
    
    console.log("UserProfileCard: Switching to account", account);
    
    // Si c'est déjà le compte actuel, ne rien faire
    if (currentAccountId === accountId) {
      return;
    }
    
    // Vérifier si le compte sélectionné correspond à la session Better Auth actuelle
    const currentSessionEmail = user?.email;
    const isSameEmail = currentSessionEmail && account.email === currentSessionEmail;
    
    // Vérifier si la session est toujours active (user existe et n'est pas null)
    // user peut être undefined pendant le chargement, donc on vérifie explicitement null
    const isSessionActive = user !== null;
    
    // NOTE: Le plugin multi-session est temporairement désactivé car il cause une erreur
    // "Cannot union empty array of streams" lors de la déconnexion avec Convex
    // On utilise donc l'ancienne méthode avec popup pour le switch de compte
    
    // Si le compte sélectionné correspond à la session actuelle (même email), juste changer l'affichage
    // Pas besoin de popup car Better Auth lie automatiquement les comptes avec le même email
    if (isSameEmail && isSessionActive) {
      console.log("UserProfileCard: Account matches current session, switching display only", {
        accountEmail: account.email,
        sessionEmail: currentSessionEmail
      });
      setCurrentAccountId(accountId);
      localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId);
      // Pas besoin de reload, juste mettre à jour l'affichage
      return;
    }
    
    // Vérifier si un autre compte stocké a le même email que le compte sélectionné
    // Si oui, Better Auth les lie automatiquement, donc pas besoin de popup
    // On vérifie aussi si la session actuelle correspond à un compte avec le même email
    const hasAccountWithSameEmail = storedAccounts.some((acc) => 
      acc.id !== accountId && acc.email === account.email
    );
    const sessionMatchesAnyAccountWithSameEmail = storedAccounts.some((acc) => 
      acc.email === account.email && currentSessionEmail && acc.email === currentSessionEmail
    );
    
    // Si un autre compte avec le même email existe ET que la session correspond à ce compte
    // Better Auth lie automatiquement, juste changer l'affichage
    if ((hasAccountWithSameEmail || sessionMatchesAnyAccountWithSameEmail) && isSessionActive) {
      console.log("UserProfileCard: Account with same email exists and session matches, switching display only", {
        accountEmail: account.email,
        sessionEmail: currentSessionEmail,
        hasAccountWithSameEmail,
        sessionMatchesAnyAccountWithSameEmail
      });
      setCurrentAccountId(accountId);
      localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId);
      return;
    }
    
    // Pour un switch transparent, on utilise une redirection complète au lieu d'une popup
    // Cela garantit que les cookies de session sont correctement partagés
    
    // Détecter le provider : d'abord depuis account.provider, sinon chercher dans storedAccounts
    // pour trouver un compte avec le même email mais un provider différent, ou utiliser "email" par défaut
    let detectedProvider = account.provider;
    
    // Si le provider n'est pas défini ou est "email"/"unknown", chercher dans tous les comptes stockés
    if (!detectedProvider || detectedProvider === "email" || detectedProvider === "unknown" || !detectedProvider) {
      console.log("UserProfileCard: Provider not found or invalid, searching in stored accounts", {
        accountProvider: account.provider,
        accountEmail: account.email,
        storedAccountsCount: storedAccounts.length
      });
      
      // Chercher dans tous les comptes stockés pour trouver un compte avec le même email
      // qui aurait un provider OAuth (github, google)
      const accountWithSameEmail = storedAccounts.find((acc) => 
        acc.email === account.email && acc.provider && (acc.provider === "github" || acc.provider === "google")
      );
      
      if (accountWithSameEmail && accountWithSameEmail.provider) {
        detectedProvider = accountWithSameEmail.provider;
        console.log("UserProfileCard: Provider detected from stored account with same email", {
          detectedProvider,
          foundInAccount: accountWithSameEmail.id
        });
        
        // Mettre à jour le provider du compte actuel pour éviter de chercher à nouveau
        account.provider = detectedProvider;
        const updatedAccounts = storedAccounts.map(acc => 
          acc.id === accountId ? account : acc
        );
        setStoredAccounts(updatedAccounts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccounts));
        console.log("UserProfileCard: Updated account provider in localStorage", account);
      } else {
        // Si toujours pas de provider, utiliser "email" par défaut
        detectedProvider = "email";
        console.log("UserProfileCard: No OAuth provider found, using 'email' as default");
      }
    }
    
    console.log("UserProfileCard: Switching account via full redirect", {
      currentEmail: currentSessionEmail,
      newEmail: account.email,
      accountProvider: account.provider,
      detectedProvider: detectedProvider,
      allStoredAccounts: storedAccounts.map(acc => ({ email: acc.email, provider: acc.provider }))
    });
    
    // Sauvegarder le compte à utiliser après reconnexion
    localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId);
    localStorage.setItem("pending_account_switch", accountId);
    
    // Se déconnecter puis rediriger vers sign-in pour se reconnecter avec le nouveau compte
    // La redirection complète garantit que les cookies sont correctement partagés
    try {
      await authClient.signOut();
      console.log("UserProfileCard: Signed out, redirecting to sign-in for transparent switch");
    } catch (error) {
      console.error("UserProfileCard: Error signing out", error);
      // Continuer quand même la redirection
    }
    
    // Rediriger vers sign-in avec les paramètres pour se reconnecter automatiquement
    // Le paramètre auto_reconnect=true déclenchera une reconnexion automatique transparente
    const redirectUrl = `/sign-in?switch_to_account=${encodeURIComponent(account.email)}&provider=${detectedProvider}&auto_reconnect=true`;
    
    // Attendre un peu pour que la déconnexion soit bien effectuée
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 200);
  };

  // Trouver le compte actuel, ou utiliser le premier disponible
  const currentAccount = currentAccountId 
    ? storedAccounts.find((acc) => acc.id === currentAccountId) 
    : storedAccounts[0];
  
  // Log de débogage (seulement si on a des comptes ou si on attend un compte)
  if (storedAccounts.length > 0 || currentAccountId) {
    console.log("UserProfileCard: Current account", { 
      currentAccountId, 
      currentAccount: currentAccount ? { 
        id: currentAccount.id,
        email: currentAccount.email, 
        name: currentAccount.name,
        provider: currentAccount.provider,
        image: currentAccount.image
      } : null,
      storedAccountsCount: storedAccounts.length,
      storedAccounts: storedAccounts.map(acc => ({ 
        id: acc.id, 
        email: acc.email,
        name: acc.name,
        provider: acc.provider,
        image: acc.image
      }))
    });
  }

  // Fonction pour changer de compte (ancien système userAccounts - gardé pour compatibilité)
  const handleAccountChange = (accountEmail: string) => {
    // Trouver le compte sélectionné dans les comptes stockés
    const selectedAccount = storedAccounts.find((acc) => acc.email === accountEmail);
    if (selectedAccount) {
      handleSwitchAccount(selectedAccount.id);
    }
  };
  
  // Logique d'affichage : 
  // PRIORITÉ 1 : Toujours utiliser le compte sélectionné depuis localStorage si disponible
  // PRIORITÉ 2 : Si le compte sélectionné correspond à la session Better Auth, utiliser les données Convex (plus à jour)
  // PRIORITÉ 3 : Fallback vers Convex ou premier compte
  const currentAccountEmail = currentAccount?.email;
  const sessionEmail = user?.email;
  const accountMatchesSession = currentAccountEmail && sessionEmail && currentAccountEmail === sessionEmail;
  
  // Toujours privilégier le compte sélectionné depuis localStorage
  // Si la session correspond, on peut utiliser les données Convex pour avoir les infos les plus récentes
  const displayUser = currentAccount ? (
    // Si le compte sélectionné correspond à la session ET qu'on a des données Convex, les utiliser (plus à jour)
    accountMatchesSession && user ? {
      name: user.name || currentAccount.name,
      email: user.email || currentAccount.email,
      image: user.image || currentAccount.image || null,
    } : {
      // Sinon, utiliser les données du compte sélectionné depuis localStorage
      // C'est important après un switch car la session Better Auth peut ne pas être encore mise à jour
      name: currentAccount.name,
      email: currentAccount.email,
      image: currentAccount.image || null,
    }
  ) : (user ? {
    // Fallback vers Convex si pas de compte sélectionné
    name: user.name,
    email: user.email,
    image: user.image || null,
  } : (storedAccounts.length > 0 && storedAccounts[0] ? {
    // Dernier fallback : premier compte dans localStorage
    name: storedAccounts[0].name,
    email: storedAccounts[0].email,
    image: storedAccounts[0].image || null,
  } : null));
  
  console.log("UserProfileCard: displayUser", {
    hasCurrentAccount: !!currentAccount,
    currentAccountId: currentAccount?.id,
    currentAccountEmail: currentAccount?.email,
    currentAccountName: currentAccount?.name,
    currentAccountProvider: currentAccount?.provider,
    currentAccountImage: currentAccount?.image,
    displayUserEmail: displayUser?.email,
    displayUserName: displayUser?.name,
    displayUserImage: displayUser?.image,
    userEmail: user?.email,
    userName: user?.name,
    userImage: user?.image,
    storedAccountsCount: storedAccounts.length
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1.5 rounded-lg sidebar-item group w-full text-left">
          <Avatar className="h-7 w-7 ring-1 ring-sidebar-border/30 ring-offset-0 transition-all group-hover:ring-sidebar-border/50">
            <AvatarImage src={displayUser?.image || undefined} alt={displayUser?.name || ""} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
              {displayUser?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-gradient-light">
              {displayUser?.name || "Utilisateur"}
            </p>
            <p className="text-[10px] truncate opacity-50 text-muted-foreground">
              {displayUser?.email || "email@example.com"}
            </p>
          </div>
          <SolarIcon
            icon="alt-arrow-right-bold"
            className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity icon-gradient-light"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-gradient-light">
                {displayUser?.name || "Utilisateur"}
              </p>
              <p className="text-xs opacity-70 text-muted-foreground">
                {displayUser?.email || "email@example.com"}
              </p>
            </div>
            {/* Note: Le système de comptes userAccounts est remplacé par le système localStorage */}
            {/* On garde cette section pour compatibilité mais elle n'est plus utilisée */}
            {false && accounts && accounts.length > 1 && (
              <Select
                value={accounts[0]?.email}
                onValueChange={(value) => {
                  handleAccountChange(value);
                }}
              >
                <SelectTrigger className="h-8 text-xs mt-2 w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <SelectValue placeholder="Changer de compte" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-full min-w-[var(--radix-select-trigger-width)]">
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.email} className="w-full">
                      <div className="flex items-center gap-2 w-full">
                        <Avatar className="h-5 w-5 flex-shrink-0">
                          <AvatarImage src={account.image || undefined} alt={account.name} />
                          <AvatarFallback className="text-[10px]">
                            {account.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs truncate">{account.name}</span>
                          <span className="text-[10px] opacity-70 truncate">{account.email}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <SolarIcon icon="user-bold" className="h-4 w-4 icon-gradient-light" />
            <span className="text-gradient-light">Profil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <SolarIcon icon="settings-bold" className="h-4 w-4 icon-gradient-light" />
            <span className="text-gradient-light">Paramètres</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing" className="flex items-center gap-2 cursor-pointer">
            <SolarIcon icon="wallet-money-bold" className="h-4 w-4 icon-gradient-light" />
            <span className="text-gradient-light">Facturation</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/help" className="flex items-center gap-2 cursor-pointer">
            <SolarIcon icon="question-circle-bold" className="h-4 w-4 icon-gradient-light" />
            <span className="text-gradient-light">Aide</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Section Organisations */}
        {organizations && organizations.length > 0 && (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              Organisations
            </DropdownMenuLabel>
            {organizations.slice(0, 3).map((org) => (
              <DropdownMenuItem key={org._id} asChild>
                <Link
                  href={`/discover/organizations/${org._id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Avatar className="h-5 w-5 flex-shrink-0">
                    <AvatarImage src={org.logo || undefined} alt={org.name} />
                    <AvatarFallback className="text-[10px]">
                      {org.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate text-gradient-light flex-1 min-w-0">
                    {org.name}
                  </span>
                  {org.role === "owner" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                      Owner
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
            {organizations.length > 3 && (
              <DropdownMenuItem asChild>
                <Link href="/organizations" className="flex items-center gap-2 cursor-pointer text-xs">
                  <SolarIcon icon="arrow-right-bold" className="h-3 w-3 icon-gradient-light" />
                  <span className="text-gradient-light">
                    Voir toutes ({organizations.length})
                  </span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Section Comptes Actifs */}
        {(() => {
          // Regrouper les comptes par email (Better Auth lie automatiquement les comptes avec le même email)
          // On ne garde qu'un seul compte par email pour l'affichage
          const uniqueAccountsByEmail = new Map<string, StoredAccount>();
          storedAccounts.forEach((account) => {
            if (!uniqueAccountsByEmail.has(account.email)) {
              uniqueAccountsByEmail.set(account.email, account);
            }
          });
          const uniqueAccounts = Array.from(uniqueAccountsByEmail.values());
          
          if (uniqueAccounts.length === 0) return null;
          
          return (
            <>
              <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Comptes actifs
              </DropdownMenuLabel>
              {uniqueAccounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    if (account.id !== currentAccountId) {
                      handleSwitchAccount(account.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={account.image || undefined} alt={account.name || ""} />
                      <AvatarFallback className="text-[10px]">
                        {account.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs truncate text-gradient-light">
                        {account.name || account.email}
                      </span>
                      <span className="text-[10px] opacity-70 truncate">
                        {account.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.provider && account.provider !== "email" && account.provider !== "unknown" && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {account.provider}
                      </span>
                    )}
                    {account.id === currentAccountId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-foreground">
                        Actuel
                      </span>
                    )}
                  </div>
                  {account.id !== currentAccountId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAccount(account.id);
                      }}
                      className="text-[10px] text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer ce compte"
                    >
                      <SolarIcon icon="trash-bin-minimalistic-bold" className="h-3 w-3" />
                    </button>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          );
        })()}

        {/* Bouton Ajouter un compte */}
        <DropdownMenuItem
          onClick={handleAddAccount}
          className="flex items-center gap-2 cursor-pointer"
        >
          <SolarIcon icon="user-plus-bold" className="h-4 w-4 icon-gradient-light" />
          <span className="text-gradient-light">Ajouter un compte</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <SolarIcon icon="logout-2-bold" className="h-4 w-4 icon-gradient-destructive" />
          <span className="text-gradient-destructive">Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

