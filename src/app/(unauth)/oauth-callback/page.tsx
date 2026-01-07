"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Page de callback OAuth générique qui détecte automatiquement
 * si on est en mode "ajouter un compte" via sessionStorage
 */
function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const ensureUserExists = useMutation(api.users.ensureUserExists);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Attendre que la session soit bien établie
      let attempts = 0;
      let session = null;
      
      while (attempts < 15 && !session) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        try {
          const result = await authClient.getSession();
          if (result?.data?.user) {
            session = result;
            break;
          }
        } catch (error) {
          console.log("Waiting for session...", attempts);
        }
        attempts++;
      }

      // Vérifier si on est en mode "ajouter un compte"
      const isAdding = typeof window !== "undefined" && 
                       sessionStorage.getItem("addingAccount") === "true";

      if (isAdding && typeof window !== "undefined" && window.opener) {
        try {
          if (session?.data?.user) {
            const user = session.data.user;
            
            // Déterminer le provider depuis l'URL
            const provider = searchParams.get("provider") || 
                            (window.location.href.includes("github") ? "github" :
                             window.location.href.includes("google") ? "google" : "unknown");
            
            console.log("OAuth Callback: Sending account to parent:", { email: user.email, provider });
            
            // Envoyer un message à la fenêtre parente
            window.opener.postMessage(
              {
                type: "ACCOUNT_ADDED",
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
            
            // Fermer la popup
            setTimeout(() => {
              if (window.opener) {
                window.close();
              }
            }, 800);
          } else {
            console.error("No session found after OAuth callback");
            if (window.opener) {
              window.close();
            }
          }
        } catch (error) {
          console.error("Error in OAuth callback:", error);
          if (window.opener) {
            window.close();
          }
        }
      } else if (!isAdding) {
        // Connexion normale - s'assurer que l'utilisateur existe dans Convex
        if (session?.data?.user) {
          const user = session.data.user;
          console.log('🔄 OAuth Callback: Ensuring user exists in Convex...', { email: user.email });
          try {
            const userId = await ensureUserExists();
            console.log('✅ OAuth Callback: User ensured in Convex via ensureUserExists', { userId, email: user.email });
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error: any) {
            console.error('❌ OAuth Callback: Failed to ensure user exists:', {
              error: error?.message || error,
              stack: error?.stack,
              email: user.email,
            });
          }
        }
        
        // Rediriger vers la page d'accueil normalement
        window.location.href = "/";
      }
    };

    handleOAuthCallback();
  }, [searchParams, ensureUserExists]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}

