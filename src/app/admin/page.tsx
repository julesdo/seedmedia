"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page utilisateurs par défaut
    router.replace("/admin/users");
  }, [router]);

  return null;
}
