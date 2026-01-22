"use client";

import { lazy, Suspense, ComponentType, ReactNode } from "react";

// Lazy load Framer Motion pour réduire le bundle initial
const MotionProvider = lazy(() =>
  import("motion/react").then((mod) => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
  }))
);

// Wrapper pour les composants motion avec fallback
export function LazyMotion({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback || <>{children}</>}>
      <MotionProvider>{children}</MotionProvider>
    </Suspense>
  );
}

// Composants motion lazy
export const LazyMotionDiv = lazy(() =>
  import("motion/react").then((mod) => ({
    default: mod.motion.div,
  }))
);

export const LazyMotionButton = lazy(() =>
  import("motion/react").then((mod) => ({
    default: mod.motion.button,
  }))
);

// Hook pour utiliser motion de manière lazy
export function useLazyMotion() {
  return lazy(() => import("motion/react"));
}

