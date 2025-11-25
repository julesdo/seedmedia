"use client";

import { useCredibilityGain } from "@/hooks/useCredibilityGain";
import { CredibilityGainToast } from "./CredibilityGainToast";

export function CredibilityGainProvider({ userId }: { userId?: string }) {
  const { gains, removeGain } = useCredibilityGain(userId);

  return (
    <>
      {gains.map((gain) => (
        <CredibilityGainToast
          key={gain.id}
          points={gain.points}
          action={gain.action}
          onComplete={() => removeGain(gain.id)}
        />
      ))}
    </>
  );
}

