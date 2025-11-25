"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Page de callback OAuth générique qui détecte automatiquement
 * si on est en mode "ajouter un compte" via sessionStorage
 */
export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();

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
        // Rediriger vers discover normalement
        window.location.href = "/studio";
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}

