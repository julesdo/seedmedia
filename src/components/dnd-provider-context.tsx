'use client';

import { useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Singleton pour le backend HTML5 - une seule instance partagée
let sharedBackend: HTML5Backend | null = null;

function getSharedBackend() {
  if (!sharedBackend && typeof window !== 'undefined') {
    // Créer une seule instance du backend
    sharedBackend = HTML5Backend;
  }
  return sharedBackend;
}

/**
 * DndProvider partagé qui utilise un backend singleton
 * À utiliser au niveau parent pour éviter les conflits
 */
export function SharedDndProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getSharedBackend(), []);
  
  if (!backend) {
    return <>{children}</>;
  }

  return (
    <DndProvider 
      backend={backend}
      options={{
        enableMouseEvents: true,
        enableTouchEvents: true,
        enableKeyboardEvents: false,
      }}
    >
      {children}
    </DndProvider>
  );
}

