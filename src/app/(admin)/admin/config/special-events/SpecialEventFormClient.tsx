"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SpecialEventForm } from "./SpecialEventForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface SpecialEventFormClientProps {
  eventId?: string;
}

export function SpecialEventFormClient({ eventId }: SpecialEventFormClientProps) {
  const router = useRouter();
  const events = useQuery(
    api.admin.getAllSpecialEvents,
    eventId ? {} : undefined
  );

  const eventData = eventId
    ? events?.find((e) => e._id === (eventId as Id<"specialEvents">))
    : undefined;

  if (eventId && events === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {eventId ? "Modifier l'événement spécial" : "Créer un événement spécial"}
        </h2>
        <p className="text-muted-foreground">
          {eventId
            ? "Modifiez les informations de l'événement spécial"
            : "Remplissez le formulaire pour créer un nouvel événement spécial"}
        </p>
      </div>

      <SpecialEventForm
        eventId={eventId as Id<"specialEvents"> | undefined}
        initialData={eventData}
        onSuccess={() => {
          router.push("/admin/config/special-events");
        }}
        onCancel={() => {
          router.push("/admin/config/special-events");
        }}
      />
    </div>
  );
}

