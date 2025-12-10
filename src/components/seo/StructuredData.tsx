"use client";

import { useEffect } from "react";

interface StructuredDataProps {
  data: object;
  id?: string;
}

export function StructuredData({ data, id = "structured-data" }: StructuredDataProps) {
  useEffect(() => {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }, [data, id]);

  return null;
}

