"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BottomNavFab {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number;
}

interface BottomNavContextValue {
  fabs: BottomNavFab[];
  investButton: ReactNode | null;
  registerFabs: (fabs: BottomNavFab[]) => void;
  registerInvestButton: (button: ReactNode | null) => void;
  clearFabs: () => void;
}

const BottomNavContext = createContext<BottomNavContextValue | undefined>(undefined);

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [fabs, setFabs] = useState<BottomNavFab[]>([]);
  const [investButton, setInvestButton] = useState<ReactNode | null>(null);

  const registerFabs = useCallback((newFabs: BottomNavFab[]) => {
    setFabs(newFabs);
  }, []);

  const registerInvestButton = useCallback((button: ReactNode | null) => {
    setInvestButton(button);
  }, []);

  const clearFabs = useCallback(() => {
    setFabs([]);
    setInvestButton(null);
  }, []);

  return (
    <BottomNavContext.Provider
      value={{
        fabs,
        investButton,
        registerFabs,
        registerInvestButton,
        clearFabs,
      }}
    >
      {children}
    </BottomNavContext.Provider>
  );
}

export function useBottomNav() {
  const context = useContext(BottomNavContext);
  if (!context) {
    throw new Error("useBottomNav must be used within BottomNavProvider");
  }
  return context;
}

