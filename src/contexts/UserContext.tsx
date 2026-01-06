"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
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

