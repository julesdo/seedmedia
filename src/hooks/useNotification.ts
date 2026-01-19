"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface CreateNotificationOptions {
  userId: Id<"users">;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  showToast?: boolean;
  toastType?: "success" | "info" | "warning" | "error";
}

/**
 * Hook pour créer et afficher des notifications
 */
export function useNotification() {
  const createNotification = useMutation(
    api.notifications.createNotificationInternal
  );

  const showNotification = async (options: CreateNotificationOptions) => {
    try {
      // Créer la notification dans la base de données
      await createNotification({
        userId: options.userId,
        type: options.type as any,
        title: options.title,
        message: options.message,
        link: options.link,
        metadata: options.metadata,
      });

      // Afficher un toast si demandé
      if (options.showToast !== false) {
        const toastType = options.toastType || "success";
        toast[toastType](options.title, {
          description: options.message,
        });
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  return { showNotification };
}

