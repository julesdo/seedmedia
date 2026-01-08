"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Page de callback OAuth qui détecte si on est en mode "ajouter un compte"
 * et envoie un message à la fenêtre parente si c'est le cas
 */
function CallbackContent() {
  // Log IMMÉDIAT au chargement du composant (avant même useEffect)
  // Utiliser window.console.log directement pour être sûr que ça fonctionne
  if (typeof window !== "undefined") {
    // Test multiple pour être sûr que les logs passent
    window.console.log("🔥🔥🔥 CALLBACK PAGE LOADED - Component mounted");
    window.console.log("URL:", window.location.href);
    window.console.log("Pathname:", window.location.pathname);
    window.console.log("Search:", window.location.search);
    window.console.log("Timestamp:", new Date().toISOString());
    
    // Test avec alert pour vérifier que le code s'exécute
    window.alert("🔥 CALLBACK PAGE LOADED - Check console for logs!");
  }

  const searchParams = useSearchParams();
  const isAddingAccount = searchParams.get("add_account") === "true";
  const isSilent = searchParams.get("silent") === "true"; // Mode silencieux pour switch de compte
  const autoReconnect = searchParams.get("auto_reconnect") === "true"; // Reconnexion automatique après switch
  
  // Hook Convex pour créer l'utilisateur
  const ensureUserExists = useMutation(api.users.ensureUserExists);

  useEffect(() => {
    console.log("🚀 Callback: useEffect started", { isAddingAccount, isSilent, autoReconnect });
    
    const handleCallback = async () => {
      console.log("🔄 Callback: handleCallback started");
      
      // Attendre que la session soit bien établie (plus de temps pour OAuth)
      let attempts = 0;
      let session = null;
      
      console.log("⏳ Callback: Waiting for Better Auth session...");
      while (attempts < 15 && !session) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        try {
          const result = await authClient.getSession();
          if (result?.data?.user) {
            session = result;
            console.log("✅ Callback: Better Auth session found", { email: result.data.user.email, attempts });
            break;
          }
        } catch (error) {
          console.log("⏳ Callback: Waiting for session...", attempts);
        }
        attempts++;
      }
      
      if (!session?.data?.user) {
        console.error("❌ Callback: No Better Auth session found after max attempts");
        return;
      }

      // Vérifier si on est en mode "ajouter un compte" (depuis URL ou sessionStorage)
      const isAdding = isAddingAccount || 
                       (typeof window !== "undefined" && sessionStorage.getItem("addingAccount") === "true");

      if ((isAdding || isSilent) && typeof window !== "undefined" && window.opener) {
        try {
          if (session?.data?.user) {
            const user = session.data.user;
            
            // Déterminer le provider depuis localStorage (le plus fiable car persiste après redirections),
            // puis sessionStorage, puis URL, puis paramètres
            const localStorageProvider = typeof window !== "undefined" ? localStorage.getItem("pendingOAuthProvider") : null;
            const sessionStorageProvider = typeof window !== "undefined" ? sessionStorage.getItem("oauthProvider") : null;
            const urlProvider = searchParams.get("provider");
            const urlIncludesGithub = window.location.href.includes("github") || window.location.href.includes("github.com");
            const urlIncludesGoogle = window.location.href.includes("google") || window.location.href.includes("google.com") || window.location.href.includes("accounts.google.com");
            
            const provider = localStorageProvider ||
                            sessionStorageProvider ||
                            urlProvider || 
                            (urlIncludesGithub ? "github" :
                             urlIncludesGoogle ? "google" : "unknown");
            
            // Nettoyer le provider de localStorage après utilisation
            if (typeof window !== "undefined" && localStorageProvider) {
              localStorage.removeItem("pendingOAuthProvider");
            }
            
            
            // Envoyer un message à la fenêtre parente
            // Si c'est en mode silencieux, envoyer ACCOUNT_SWITCHED, sinon ACCOUNT_ADDED
            const messageType = isSilent ? "ACCOUNT_SWITCHED" : "ACCOUNT_ADDED";
            
            window.opener.postMessage(
              {
                type: messageType,
                account: {
                  email: user.email,
                  name: user.name,
                  image: user.image,
                  provider: provider,
                },
              },
              window.location.origin
            );
            
            // Nettoyer le flag
            sessionStorage.removeItem("addingAccount");
            
            // Attendre un peu avant de fermer pour s'assurer que le message est envoyé
            setTimeout(() => {
              if (window.opener) {
                window.close();
              }
            }, 800);
          } else {
            console.error("No session found after OAuth callback");
            // Fermer quand même la popup
            if (window.opener) {
              window.close();
            }
          }
        } catch (error) {
          console.error("Error in callback:", error);
          // Fermer quand même la popup
          if (window.opener) {
            window.close();
          }
        }
      } else if (!isAdding && !isSilent) {
        // Connexion normale (première connexion) - mettre à jour le provider dans localStorage
        console.log("📝 Callback: Normal login flow (first login)");
        if (session?.data?.user) {
          const user = session.data.user;
          console.log("👤 Callback: User from session", { email: user.email, name: user.name });
          const localStorageProvider = typeof window !== "undefined" ? localStorage.getItem("pendingOAuthProvider") : null;
          const sessionStorageProvider = typeof window !== "undefined" ? sessionStorage.getItem("oauthProvider") : null;
          const urlProvider = searchParams.get("provider");
          const urlIncludesGithub = window.location.href.includes("github") || window.location.href.includes("github.com");
          const urlIncludesGoogle = window.location.href.includes("google") || window.location.href.includes("google.com") || window.location.href.includes("accounts.google.com");
          
          const provider = localStorageProvider ||
                          sessionStorageProvider ||
                          urlProvider || 
                          (urlIncludesGithub ? "github" :
                           urlIncludesGoogle ? "google" : "unknown");
          
          // Nettoyer le provider de localStorage après utilisation
          if (typeof window !== "undefined" && localStorageProvider) {
            localStorage.removeItem("pendingOAuthProvider");
          }
          
          // Mettre à jour le provider dans localStorage si c'est un provider OAuth valide
          if (provider && provider !== "unknown" && provider !== "email") {
            try {
              const stored = localStorage.getItem("seed_active_accounts");
              if (stored) {
                const accounts = JSON.parse(stored);
                const accountIndex = accounts.findIndex((acc: any) => acc.email === user.email);
                if (accountIndex !== -1) {
                  accounts[accountIndex].provider = provider;
                  localStorage.setItem("seed_active_accounts", JSON.stringify(accounts));
                } else {
                  // Si le compte n'existe pas encore, le créer avec le bon provider
                  const newAccount = {
                    id: `account-${Date.now()}`,
                    email: user.email,
                    name: user.name || user.email.split("@")[0] || "Utilisateur",
                    image: user.image || null,
                    provider: provider,
                    addedAt: Date.now(),
                  };
                  accounts.push(newAccount);
                  localStorage.setItem("seed_active_accounts", JSON.stringify(accounts));
                }
              } else {
                // Si aucun compte n'existe, créer le premier avec le bon provider
                const newAccount = {
                  id: `account-${Date.now()}`,
                  email: user.email,
                  name: user.name || user.email.split("@")[0] || "Utilisateur",
                  image: user.image || null,
                  provider: provider,
                  addedAt: Date.now(),
                };
                localStorage.setItem("seed_active_accounts", JSON.stringify([newAccount]));
              }
            } catch (error) {
              // Ignorer les erreurs
            }
          }
          
          // NOUVEAU : S'assurer que l'utilisateur existe dans Convex avant de rediriger
          // On appelle directement ensureUserExists pour garantir la création, même si le trigger onCreate échoue
          // Cela résout la race condition en production où la latence réseau peut retarder le trigger
          console.log('🔄 Callback: Ensuring user exists in Convex...', { 
            email: user.email,
            ensureUserExistsType: typeof ensureUserExists,
            isFunction: typeof ensureUserExists === 'function'
          });
          
          if (typeof ensureUserExists !== 'function') {
            console.error('❌ Callback: ensureUserExists is not a function!', { ensureUserExists });
            return;
          }
          
          try {
            console.log('📞 Callback: Calling ensureUserExists mutation...', {
              email: user.email,
              ensureUserExists: ensureUserExists,
              typeof: typeof ensureUserExists,
            });
            
            // Appeler la mutation et attendre le résultat
            const userId = await ensureUserExists();
            
            console.log('✅ Callback: User ensured in Convex via ensureUserExists', { 
              userId, 
              email: user.email,
              userIdType: typeof userId,
            });
            
            // Attendre un peu pour que la création soit propagée dans la base de données
            await new Promise((resolve) => setTimeout(resolve, 500));
            
            console.log('✅ Callback: Waiting complete, ready to redirect');
          } catch (error: any) {
            console.error('❌ Callback: Failed to ensure user exists:', {
              error: error?.message || error,
              stack: error?.stack,
              email: user.email,
              errorName: error?.name,
              errorType: typeof error,
              errorString: String(error),
            });
            // Ne pas rediriger immédiatement - laisser l'utilisateur voir l'erreur
            // Le trigger onCreate pourrait quand même créer l'utilisateur en arrière-plan
            return; // Sortir sans rediriger pour voir l'erreur
          }
        }
        
        // Rediriger vers la page d'accueil
        console.log("🏠 Callback: Redirecting to home page...");
        window.location.href = "/";
      } else if ((isSilent || autoReconnect) && typeof window !== "undefined" && !window.opener) {
        // Si on est en mode silencieux ou auto_reconnect mais pas dans une popup
        // Mettre à jour le provider dans localStorage si on a une session
        if (session?.data?.user) {
          const user = session.data.user;
          const localStorageProvider = typeof window !== "undefined" ? localStorage.getItem("pendingOAuthProvider") : null;
          const sessionStorageProvider = typeof window !== "undefined" ? sessionStorage.getItem("oauthProvider") : null;
          const urlProvider = searchParams.get("provider");
          const urlIncludesGithub = window.location.href.includes("github") || window.location.href.includes("github.com");
          const urlIncludesGoogle = window.location.href.includes("google") || window.location.href.includes("google.com") || window.location.href.includes("accounts.google.com");
          
          const provider = localStorageProvider ||
                          sessionStorageProvider ||
                          urlProvider || 
                          (urlIncludesGithub ? "github" :
                           urlIncludesGoogle ? "google" : "unknown");
          
          // Nettoyer le provider de localStorage après utilisation
          if (typeof window !== "undefined" && localStorageProvider) {
            localStorage.removeItem("pendingOAuthProvider");
          }
          
          if (provider && provider !== "unknown" && provider !== "email") {
            // Mettre à jour le provider dans localStorage
            try {
              const stored = localStorage.getItem("seed_active_accounts");
              if (stored) {
                const accounts = JSON.parse(stored);
                const accountIndex = accounts.findIndex((acc: any) => acc.email === user.email);
                if (accountIndex !== -1) {
                  accounts[accountIndex].provider = provider;
                  localStorage.setItem("seed_active_accounts", JSON.stringify(accounts));
                  console.log("Callback: Updated provider in localStorage for auto_reconnect", { email: user.email, provider });
                }
              }
            } catch (error) {
              console.error("Callback: Error updating provider in localStorage", error);
            }
          }
        }
        
        console.log("Callback: Auto-reconnect successful, redirecting to home");
        // Nettoyer le provider du sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("oauthProvider");
        }
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      }
    };

    handleCallback();
  }, [isAddingAccount, isSilent, searchParams, ensureUserExists]);

  // Log au render
  if (typeof window !== "undefined") {
    console.log("🎨 Callback: Component rendering", { timestamp: new Date().toISOString() });
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Connexion en cours...</p>
        {typeof window !== "undefined" && (
          <p className="text-xs text-muted-foreground mt-2">
            URL: {window.location.href}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

