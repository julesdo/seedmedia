"use client";

import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@/contexts/UserContext";

/**
 * Wrapper pour toast qui enregistre aussi la notification dans la base de données
 */
export function createNotificationToast() {
  // Cette fonction sera utilisée dans un composant client avec hooks
  return {
    success: async (
      title: string,
      message?: string,
      options?: {
        userId?: Id<"users">;
        link?: string;
        metadata?: any;
      }
    ) => {
      toast.success(title, {
        description: message,
      });

      // Enregistrer dans la base de données si userId est fourni
      if (options?.userId) {
        try {
          // Appel direct à la mutation (nécessite d'être dans un composant client)
          // Cette fonction sera utilisée via un hook personnalisé
        } catch (error) {
          console.error("Error creating notification:", error);
        }
      }
    },
    error: (title: string, message?: string) => {
      toast.error(title, {
        description: message,
      });
    },
    info: (title: string, message?: string) => {
      toast.info(title, {
        description: message,
      });
    },
    warning: (title: string, message?: string) => {
      toast.warning(title, {
        description: message,
      });
    },
  };
}

/**
 * Hook pour créer des notifications avec toast
 */
export function useNotificationToast() {
  const { user } = useUser();
  const createNotification = useMutation(api.notifications.createNotification);

  const showNotification = async (
    type: string,
    title: string,
    message: string,
    options?: {
      link?: string;
      metadata?: any;
      toastType?: "success" | "info" | "warning" | "error";
    }
  ) => {
    // Afficher le toast
    const toastType = options?.toastType || "success";
    toast[toastType](title, {
      description: message,
    });

    // Enregistrer dans la base de données si l'utilisateur est connecté
    if (user?._id) {
      try {
        await createNotification({
          userId: user._id,
          type: type as any,
          title,
          message,
          link: options?.link,
          metadata: options?.metadata,
        });
      } catch (error) {
        console.error("Error creating notification:", error);
      }
    }
  };

  return { showNotification };
}

