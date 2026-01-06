"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileClient } from "./ProfileClient";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();

  useEffect(() => {
    if (user?.username) {
      // Si l'utilisateur a un username, rediriger vers /u/[username]
      router.replace(`/u/${user.username}`);
    }
  }, [user, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-[614px] mx-auto px-4 text-center">
          <Skeleton className="h-64 w-full mb-6" />
        </div>
      </div>
    );
  }

  // Si l'utilisateur a un username, on redirige (le useEffect le fera)
  if (user?.username) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  // Afficher le profil privé si pas de username
  return <ProfileClient />;
}
