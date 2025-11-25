"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string; // blob URL ou Convex URL
  onChange: (url: string | undefined, file?: File) => void; // Callback avec URL et File optionnel
  label?: string;
  description?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Image de couverture",
  description,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [file, setFile] = useState<File | null>(null);

  // Synchroniser la preview avec la valeur externe
  useEffect(() => {
    if (value !== undefined) {
      setPreview(value);
    }
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validation
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 Mo
    if (selectedFile.size > maxSize) {
      const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      toast.error(`L'image est trop lourde (${fileSizeMB} Mo). La taille maximale est de 5 Mo.`);
      // Réinitialiser l'input
      e.target.value = '';
      return;
    }

    try {
      // Créer une URL blob pour la preview locale
      const blobUrl = URL.createObjectURL(selectedFile);
      setPreview(blobUrl);
      setFile(selectedFile);
      
      // Notifier le parent avec le blob URL et le fichier
      onChange(blobUrl, selectedFile);
    } catch (error) {
      console.error("Erreur création blob URL:", error);
      toast.error("Erreur lors de la sélection de l'image");
    }
  };

  const handleRemove = () => {
    // Libérer l'URL blob si c'est un blob URL
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFile(null);
    onChange(undefined);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground/70">{description}</p>
      )}

      {preview ? (
        <div className="relative group">
          <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border/20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            {preview.startsWith('blob:') ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-xs"
            onClick={handleRemove}
          >
            <SolarIcon icon="trash-bin-trash-bold" className="h-3 w-3 mr-1" />
            Supprimer
          </Button>
        </div>
      ) : (
        <label
          htmlFor="image-upload"
          className={cn(
            "flex flex-col items-center justify-center gap-2",
            "w-full aspect-video rounded-md border-2 border-dashed border-border/20",
            "bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
            "hover:border-border/40 hover:bg-background transition-colors",
            "cursor-pointer"
          )}
        >
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <SolarIcon icon="image-bold" className="h-8 w-8 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Cliquez pour ajouter une image
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP jusqu'à 5 Mo
            </p>
          </div>
        </label>
      )}
    </div>
  );
}

