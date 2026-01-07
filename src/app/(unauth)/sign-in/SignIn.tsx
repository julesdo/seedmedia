"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { useTranslations } from 'next-intl';
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";

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

export default function SignIn() {
  const t = useTranslations('auth.signIn');
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const isAddingAccount = searchParams.get("add_account") === "true";
  const switchToAccount = searchParams.get("switch_to_account");
  const switchProvider = searchParams.get("provider");
  const isSilent = searchParams.get("silent") === "true"; // Mode silencieux pour switch de compte
  const autoReconnect = searchParams.get("auto_reconnect") === "true"; // Reconnexion automatique après switch
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>([]);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);
  
  // Fonctions de connexion OAuth (définies tôt pour être accessibles dans useEffect)
  const handleGithubSignIn = async () => {
    // Stocker le provider dans localStorage ET sessionStorage pour la détection ultérieure
    // localStorage persiste même après les redirections OAuth
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oauthProvider", "github");
      localStorage.setItem("pendingOAuthProvider", "github");
    }
    
    await authClient.signIn.social(
      {
        provider: "github",
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async (ctx) => {
          setLoading(false);
          
          // Si on est en mode silencieux (switch de compte), envoyer un message au parent
          if (isSilent && typeof window !== "undefined" && window.opener) {
            const session = await authClient.getSession();
            if (session?.data?.user) {
              window.opener.postMessage(
                {
                  type: "ACCOUNT_SWITCHED",
                  account: {
                    email: session.data.user.email,
                    name: session.data.user.name,
                    image: session.data.user.image,
                  },
                },
                window.location.origin
              );
              // Fermer la popup après un court délai
              setTimeout(() => {
                window.close();
              }, 500);
              return;
            }
          }
          
          // Si on est en mode auto_reconnect (reconnexion automatique après switch dans la fenêtre principale)
          if (autoReconnect && typeof window !== "undefined" && !window.opener) {
            console.log("SignIn: Auto-reconnect successful (OAuth), redirecting to discover");
            // Pour OAuth, la redirection se fait automatiquement vers callbackURL
            // Le callback page gérera la redirection vers discover
            return;
          }
          
          // Pour OAuth, la redirection se fait automatiquement vers callbackURL
          // Le callback page gérera l'envoi du message
          
          // Si on switch de compte, nettoyer le flag
          if (switchToAccount && typeof window !== "undefined") {
            localStorage.removeItem("pending_account_switch");
          }
          
          if (!isAddingAccount && !isSilent) {
            router.push("/studio");
          }
        },
        onError: (ctx) => {
          setLoading(false);
          alert(ctx.error.message);
        },
      },
    );
  };

  const handleGoogleSignIn = async () => {
    // Stocker le provider dans localStorage ET sessionStorage pour la détection ultérieure
    // localStorage persiste même après les redirections OAuth
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oauthProvider", "google");
      localStorage.setItem("pendingOAuthProvider", "google");
    }
    
    await authClient.signIn.social(
      {
        provider: "google",
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async (ctx) => {
          setLoading(false);
          
          // Si on est en mode silencieux (switch de compte), envoyer un message au parent
          if (isSilent && typeof window !== "undefined" && window.opener) {
            const session = await authClient.getSession();
            if (session?.data?.user) {
              window.opener.postMessage(
                {
                  type: "ACCOUNT_SWITCHED",
                  account: {
                    email: session.data.user.email,
                    name: session.data.user.name,
                    image: session.data.user.image,
                  },
                },
                window.location.origin
              );
              // Fermer la popup après un court délai
              setTimeout(() => {
                window.close();
              }, 500);
              return;
            }
          }
          
          // Si on est en mode auto_reconnect (reconnexion automatique après switch dans la fenêtre principale)
          if (autoReconnect && typeof window !== "undefined" && !window.opener) {
            console.log("SignIn: Auto-reconnect successful (OAuth), redirecting to discover");
            // Pour OAuth, la redirection se fait automatiquement vers callbackURL
            // Le callback page gérera la redirection vers discover
            return;
          }
          
          // Pour OAuth, la redirection se fait automatiquement vers callbackURL
          // Le callback page gérera l'envoi du message
          
          // Si on switch de compte, nettoyer le flag
          if (switchToAccount && typeof window !== "undefined") {
            localStorage.removeItem("pending_account_switch");
          }
          
          if (!isAddingAccount && !isSilent) {
            router.push("/studio");
          }
        },
        onError: (ctx) => {
          setLoading(false);
          alert(ctx.error.message);
        },
      },
    );
  };

  // Si on switch de compte, pré-remplir l'email et sélectionner le provider
  useEffect(() => {
    if (switchToAccount) {
      console.log("SignIn: Switching to account", { email: switchToAccount, provider: switchProvider, autoReconnect });
      
      // Si auto_reconnect est true, afficher un écran de chargement pour un switch transparent
      if (autoReconnect) {
        setIsAutoReconnecting(true);
      }
      
      // S'assurer qu'on est bien déconnecté avant de se reconnecter
      const ensureSignedOut = async () => {
        try {
          await authClient.signOut();
          console.log("SignIn: Ensured signed out before switching");
          // Attendre un peu pour que la déconnexion soit bien effectuée
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error("SignIn: Error ensuring signOut", error);
        }
      };
      
      ensureSignedOut().then(() => {
        setEmail(switchToAccount);
        // Si c'est un provider OAuth (github, google), déclencher automatiquement la connexion
        if (switchProvider === "github" || switchProvider === "google") {
          // Attendre un peu pour que le composant soit monté et la déconnexion complète
          // Si auto_reconnect est true, on déclenche immédiatement pour un switch transparent
          const delay = autoReconnect ? 500 : 800;
          setTimeout(() => {
            if (switchProvider === "github") {
              handleGithubSignIn();
            } else if (switchProvider === "google") {
              handleGoogleSignIn();
            }
          }, delay);
        }
      });
    }
  }, [switchToAccount, switchProvider, autoReconnect]);

  // Charger les comptes depuis localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedAccounts = JSON.parse(stored) as StoredAccount[];
        setStoredAccounts(parsedAccounts);
      } catch (error) {
        console.error("Failed to parse stored accounts:", error);
      }
    }
  }, []);

  // Si on est en mode "ajouter un compte" dans une popup, se déconnecter d'abord
  useEffect(() => {
    if (isAddingAccount && typeof window !== "undefined" && window.opener) {
      // Marquer dans sessionStorage
      sessionStorage.setItem("addingAccount", "true");
      
      // Se déconnecter silencieusement pour permettre une nouvelle connexion
      // Attendre un peu pour que la page soit chargée
      setTimeout(() => {
        authClient.signOut().catch(() => {
          // Ignorer les erreurs de déconnexion
        });
      }, 100);
    }
  }, [isAddingAccount]);

  // Surveiller les changements de session pour détecter une nouvelle connexion OAuth
  useEffect(() => {
    if (typeof window === "undefined" || !window.opener) return;

    let previousEmail: string | null = null;
    let checkCount = 0;
    const maxChecks = 30; // 30 secondes max

    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        const isAdding = sessionStorage.getItem("addingAccount") === "true";
        
        if (session?.data?.user && isAdding) {
          const currentEmail = session.data.user.email;
          
          // Si on a une nouvelle session (email différent ou première détection)
          if (currentEmail && currentEmail !== previousEmail) {
            previousEmail = currentEmail;
            
            // Déterminer le provider depuis localStorage (le plus fiable), puis sessionStorage, puis URL
            const localStorageProvider = typeof window !== "undefined" ? localStorage.getItem("pendingOAuthProvider") : null;
            const sessionStorageProvider = typeof window !== "undefined" ? sessionStorage.getItem("oauthProvider") : null;
            const urlIncludesGithub = window.location.href.includes("github") || window.location.href.includes("github.com");
            const urlIncludesGoogle = window.location.href.includes("google") || window.location.href.includes("google.com") || window.location.href.includes("accounts.google.com");
            
            const provider = localStorageProvider ||
                            sessionStorageProvider ||
                            (urlIncludesGithub ? "github" :
                             urlIncludesGoogle ? "google" : "unknown");
            
            // Nettoyer le provider de localStorage après utilisation
            if (typeof window !== "undefined" && localStorageProvider) {
              localStorage.removeItem("pendingOAuthProvider");
            }
            
            // Envoyer le message à la fenêtre parente
            window.opener.postMessage(
              {
                type: "ACCOUNT_ADDED",
                account: {
                  email: session.data.user.email,
                  name: session.data.user.name,
                  image: session.data.user.image,
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
            }, 500);
            
            return; // Arrêter la vérification
          }
        }
        
        checkCount++;
        if (checkCount >= maxChecks) {
          // Timeout après 30 secondes
          sessionStorage.removeItem("addingAccount");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    // Vérifier immédiatement puis périodiquement
    checkSession();
    const interval = setInterval(checkSession, 1000);

    // Nettoyer après 30 secondes
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleSignIn = async () => {
    const { data, error } = await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async (ctx) => {
          setLoading(false);
          
          // Si on est en mode silencieux (switch de compte), envoyer un message au parent
          if (isSilent && typeof window !== "undefined" && window.opener) {
            const session = await authClient.getSession();
            if (session?.data?.user) {
              window.opener.postMessage(
                {
                  type: "ACCOUNT_SWITCHED",
                  account: {
                    email: session.data.user.email,
                    name: session.data.user.name,
                    image: session.data.user.image,
                  },
                },
                window.location.origin
              );
              // Fermer la popup après un court délai
              setTimeout(() => {
                window.close();
              }, 500);
              return;
            }
          }
          
          // Si on est en mode auto_reconnect (reconnexion automatique après switch dans la fenêtre principale)
          if (autoReconnect && typeof window !== "undefined" && !window.opener) {
            console.log("SignIn: Auto-reconnect successful (email), redirecting to discover");
            // Attendre un peu pour que la session soit bien établie
            setTimeout(() => {
              window.location.href = "/studio";
            }, 500);
            return;
          }
          
          // Si on est en mode "ajouter un compte" dans une popup
          if (isAddingAccount && typeof window !== "undefined" && window.opener) {
            const session = await authClient.getSession();
            if (session?.data?.user) {
              const user = session.data.user;
              window.opener.postMessage(
                {
                  type: "ACCOUNT_ADDED",
                  account: {
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    provider: "email",
                  },
                },
                window.location.origin
              );
              window.close();
              return;
            }
          }
          if (ctx.data.twoFactorRedirect) {
            router.push("/verify-2fa");
          } else {
            router.push("/");
          }
        },
        onError: (ctx) => {
          setLoading(false);
          alert(ctx.error.message);
        },
      },
    );

    console.log({ data, error });
  };

  const handleResetPassword = async () => {
    setForgotLoading(true);
    try {
      await authClient.forgetPassword({
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      });
      alert(t('checkEmail'));
    } catch {
      alert(t('resetPasswordFailed'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSelectAccount = async (account: StoredAccount) => {
    console.log("SignIn: Selecting account", account);
    
    // S'assurer qu'on est bien déconnecté avant de se reconnecter
    try {
      await authClient.signOut();
      console.log("SignIn: Signed out before selecting account");
      // Attendre un peu pour que la déconnexion soit bien effectuée
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("SignIn: Error signing out", error);
    }
    
    // Définir ce compte comme compte actuel
    localStorage.setItem(CURRENT_ACCOUNT_KEY, account.id);
    
    // Se connecter avec le provider approprié
    if (account.provider === "github") {
      await handleGithubSignIn();
    } else if (account.provider === "google") {
      await handleGoogleSignIn();
    } else {
      // Pour les comptes email, pré-remplir l'email et laisser l'utilisateur entrer le mot de passe
      setEmail(account.email);
      // Focus sur le champ password pour que l'utilisateur puisse entrer son mot de passe
      // L'utilisateur devra cliquer sur "Sign In" manuellement
    }
  };



  // Si on est en mode auto_reconnect, afficher un écran de chargement transparent
  if (isAutoReconnecting) {
    return (
      <Card className="max-w-md w-full bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">{t('switchingAccount')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl mx-4 sm:mx-auto">
      <CardHeader className="pb-4 px-4 sm:px-6 pt-6 sm:pt-6">
        {/* Logo */}
        <Link href="/" className="mb-4 sm:mb-6 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <SolarIcon icon="leaf-bold" className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Seed</span>
          </div>
        </Link>
        <CardTitle className="text-xl md:text-2xl font-bold text-center sm:text-left">{t('title')}</CardTitle>
        <CardDescription className="text-sm md:text-base mt-2 text-center sm:text-left">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6 sm:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignIn();
          }}
          className="grid gap-4 sm:gap-5"
        >
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              className="h-11 sm:h-12 text-base"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <Label htmlFor="password" className="text-sm font-medium">{t('password')}</Label>
              <Button
                variant="link"
                size="sm"
                type="button"
                onClick={handleResetPassword}
                className="cursor-pointer h-auto p-0 text-xs sm:text-xs self-start sm:self-auto"
                disabled={forgotLoading || !email}
              >
                {forgotLoading ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                {t('forgotPassword')}
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder={t('password')}
              autoComplete="password"
              required
              className="h-11 sm:h-12 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold mt-2" disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : null}
            {t('signInWithPassword')}
          </Button>

          <div className="relative my-2 sm:my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background/95 backdrop-blur-sm px-2 text-muted-foreground">
                {t('orContinueWith')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-11 sm:h-12"
            disabled={loading}
            onClick={handleGithubSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
              />
            </svg>
            {t('signInWithGithub')}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 h-11 sm:h-12"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="0.98em"
              height="1em"
              viewBox="0 0 256 262"
            >
              <path
                fill="#4285F4"
                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              />
              <path
                fill="#34A853"
                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              />
              <path
                fill="#FBBC05"
                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
              />
              <path
                fill="#EB4335"
                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              />
            </svg>
            {t('signInWithGoogle')}
          </Button>
        </form>
        
        {/* Afficher les comptes actifs s'il y en a */}
        {storedAccounts.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <Label className="text-xs text-muted-foreground mb-3 block">
              {t('activeAccounts')}
            </Label>
            <div className="space-y-2">
              {storedAccounts.map((account) => (
                <Button
                  key={account.id}
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 px-3 sm:px-4"
                  onClick={() => handleSelectAccount(account)}
                >
                  {account.image ? (
                    <img
                      src={account.image}
                      alt={account.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {account.email}
                    </div>
                  </div>
                  {account.provider && (
                    <div className="text-xs text-muted-foreground">
                      {account.provider}
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
