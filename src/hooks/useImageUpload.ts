"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface UseImageUploadOptions {
  maxSize?: number; // En bytes (défaut: 5MB)
  acceptedFileTypes?: string[]; // Ex: ["image/jpeg", "image/png"]
  onUploadSuccess?: (url: string, storageId: Id<"_storage">) => void;
  onUploadError?: (error: Error) => void;
}

interface UseImageUploadReturn {
  uploadFile: (file: File) => Promise<string | null>; // Retourne l'URL ou null
  isUploading: boolean;
  uploadProgress: number;
}

/**
 * Hook réutilisable pour l'upload d'images avec Convex File Storage
 */
/**
 * Normalise les types de fichiers acceptés (gère les wildcards comme "image/*")
 */
function normalizeAcceptedFileTypes(types: string[]): string[] {
  const normalized: string[] = [];
  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  
  for (const type of types) {
    if (type === "image/*") {
      normalized.push(...imageTypes);
    } else {
      normalized.push(type);
    }
  }
  
  return [...new Set(normalized)]; // Supprimer les doublons
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB par défaut
    acceptedFileTypes: rawAcceptedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    onUploadSuccess,
    onUploadError,
  } = options;

  // Normaliser les types acceptés (gérer les wildcards)
  const acceptedFileTypes = normalizeAcceptedFileTypes(rawAcceptedFileTypes);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveFileAfterUpload = useMutation(api.storage.saveFileAfterUpload);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Validation du type de fichier
      if (!acceptedFileTypes.includes(file.type)) {
        const acceptedTypes = acceptedFileTypes
          .map((t) => t.split("/")[1])
          .filter((t) => t !== "*") // Exclure les wildcards
          .join(", ");
        throw new Error(
          `Type de fichier non accepté. Types acceptés: ${acceptedTypes || "images"}`
        );
      }

      // Validation de la taille
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
        throw new Error(`Fichier trop volumineux. Taille max: ${maxSizeMB}MB`);
      }

      setIsUploading(true);
      setUploadProgress(0);

      // 1. Générer l'URL d'upload
      const uploadUrl = await generateUploadUrl();
      setUploadProgress(20);

      // 2. Upload le fichier vers Convex Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Échec de l'upload du fichier");
      }

      setUploadProgress(60);

      const { storageId } = await uploadResponse.json();
      if (!storageId) {
        throw new Error("Aucun storageId retourné");
      }

      // 3. Sauvegarder les métadonnées et récupérer l'URL
      const result = await saveFileAfterUpload({
        storageId,
        fileName: file.name,
        contentType: file.type,
      });

      setUploadProgress(100);

      if (!result.url) {
        throw new Error("Impossible de récupérer l'URL du fichier");
      }

      // Petit délai pour que la progress bar soit visible
      await new Promise((resolve) => setTimeout(resolve, 200));

      setIsUploading(false);
      onUploadSuccess?.(result.url, result.storageId);
      toast.success("Image uploadée avec succès");

      // Reset progress après un délai
      setTimeout(() => setUploadProgress(0), 500);

      return result.url;
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error);
      const errorMessage = error.message || "Erreur lors de l'upload de l'image";
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(errorMessage);
      onUploadError?.(error);
      return null;
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
  };
}

