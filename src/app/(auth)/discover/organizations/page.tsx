"use client";

import { useEffect } from "react";
import { useTransitionRouter } from "next-view-transitions";

export default function OrganizationsDiscoverRedirect() {
  const router = useTransitionRouter();

  useEffect(() => {
    router.replace("/discover");
  }, [router]);

  return null;
}

