"use client";

import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  [key: string]: any; // Pour les autres propriétés
}

interface UserContextType {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  
  // Requête utilisateur - seulement si authentifié
  const user = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  ) as User | null | undefined;

  // Mutation pour créer l'utilisateur s'il n'existe pas
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  
  // Ref pour éviter les appels multiples
  const hasTriedEnsure = useRef(false);
  const lastAuthState = useRef(false);

  // Détecter quand un utilisateur est authentifié mais n'existe pas encore dans Convex
  useEffect(() => {
    // Si l'authentification vient de changer (de false à true)
    const authJustChanged = isAuthenticated && !lastAuthState.current;
    lastAuthState.current = isAuthenticated;

    // Si authentifié mais pas d'utilisateur Convex, et qu'on n'a pas encore essayé
    if (isAuthenticated && user === null && !hasTriedEnsure.current && !authLoading) {
      window.console.log("🔄 UserProvider: User authenticated but not in Convex, ensuring user exists...");
      hasTriedEnsure.current = true;
      
      ensureUserExists()
        .then((userId) => {
          window.console.log("✅ UserProvider: User ensured in Convex", { userId });
          // Réinitialiser le flag après un délai pour permettre un nouvel essai si nécessaire
          setTimeout(() => {
            hasTriedEnsure.current = false;
          }, 5000);
        })
        .catch((error) => {
          window.console.error("❌ UserProvider: Failed to ensure user exists:", error);
          // Réinitialiser le flag pour permettre un nouvel essai
          setTimeout(() => {
            hasTriedEnsure.current = false;
          }, 5000);
        });
    }
    
    // Réinitialiser le flag si l'utilisateur existe maintenant
    if (user !== null && user !== undefined) {
      hasTriedEnsure.current = false;
    }
  }, [isAuthenticated, user, authLoading, ensureUserExists]);

  const isLoading = authLoading || (isAuthenticated && user === undefined);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: isAuthenticated && !!user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

