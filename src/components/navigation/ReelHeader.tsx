"use client";

import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { SeedsDisplayWithShop } from "@/components/ui/SeedsDisplayWithShop";

export function ReelHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-3 pointer-events-none">
      {/* Logo Seed à gauche */}
      <Link href="/" className="flex items-center pointer-events-auto">
        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <SolarIcon icon="leaf-bold" className="size-5 text-white" />
        </div>
      </Link>

      {/* Ligne avec bouton + et Seeds à droite */}
      <div className="pointer-events-auto">
        <SeedsDisplayWithShop variant="reel" buttonSize="sm" animated />
      </div>
    </div>
  );
}

