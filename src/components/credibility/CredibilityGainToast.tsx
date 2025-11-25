"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface CredibilityGainToastProps {
  points: number;
  action: string;
  onComplete?: () => void;
}

export function CredibilityGainToast({ points, action, onComplete }: CredibilityGainToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-20 right-4 z-[100] pointer-events-none"
        >
          <motion.div
            initial={{ rotate: -5 }}
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
            className={cn(
              "relative bg-gradient-to-br from-green-500/90 to-emerald-600/90 dark:from-green-600/90 dark:to-emerald-700/90",
              "backdrop-blur-md border border-green-400/50 dark:border-green-500/50",
              "rounded-xl shadow-2xl shadow-green-500/20 dark:shadow-green-600/20",
              "px-4 py-3 min-w-[280px]",
              "pointer-events-auto"
            )}
          >
            {/* Effet de brillance animé */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "linear",
              }}
            />

            <div className="relative flex items-center gap-3">
              {/* Icône avec animation de pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="flex-shrink-0"
              >
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <SolarIcon icon="star-bold" className="h-5 w-5 text-white" />
                </div>
              </motion.div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-2xl font-bold text-white">
                    +{points.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-white/90">
                    crédibilité
                  </span>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-white/80 mt-0.5 line-clamp-1"
                >
                  {action}
                </motion.p>
              </div>

              {/* Particules animées */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    x: [0, Math.cos((i * 120) * Math.PI / 180) * 30],
                    y: [0, Math.sin((i * 120) * Math.PI / 180) * 30],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.5 + i * 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

