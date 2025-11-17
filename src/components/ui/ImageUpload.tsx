"use client";

import { useState, useCallback, useEffect } from "react";
import * as React from "react";
import { Dropzone, DropzoneEmptyState, DropzoneContent } from "@/components/ui/shadcn-io/dropzone";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  value?: string | null; // URL de l'image actuelle
  onChange?: (url: string | null) => void; // Callback avec l'URL
  onStorageIdChange?: (storageId: string | null) => void; // Callback avec le storageId
  accept?: string[]; // Types de fichiers acceptés
  maxSize?: number; // Taille max en bytes
  aspectRatio?: number; // Ratio d'aspect (ex: 16/9)
  label?: string;
  description?: string;
  className?: string;
  variant?: "avatar" | "cover" | "default"; // Variantes d'affichage
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onStorageIdChange,
  accept = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxSize = 5 * 1024 * 1024, // 5MB par défaut
  aspectRatio,
  label,
  description,
  className,
  variant = "default",
  disabled = false,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  
  // Synchroniser la preview avec la valeur externe
  React.useEffect(() => {
    if (value !== undefined) {
      setPreview(value);
    }
  }, [value]);

  const { uploadFile, isUploading, uploadProgress } = useImageUpload({
    maxSize,
    acceptedFileTypes: accept,
    onUploadSuccess: (url, storageId) => {
      setPreview(url);
      onChange?.(url);
      onStorageIdChange?.(storageId);
      setSelectedFile(null);
    },
  });

  const handleDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: any[], event: any) => {
      if (fileRejections.length > 0) {
        // L'erreur sera gérée par useImageUpload via onDrop callback
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        
        // Créer une preview locale immédiatement
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload le fichier
        const url = await uploadFile(file);
        if (url) {
          setPreview(url);
        }
      }
    },
    [uploadFile]
  );

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    onChange?.(null);
    onStorageIdChange?.(null);
  };

  // Variante Avatar
  if (variant === "avatar") {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="text-sm font-medium text-gradient-light">{label}</label>
        )}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border/50 ring-2 ring-border/50">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <SolarIcon icon="user-bold" className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <SolarIcon icon="loader-circle-bold" className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <Dropzone
              onDrop={handleDrop}
              accept={accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {})}
              maxSize={maxSize}
              maxFiles={1}
              disabled={disabled || isUploading}
              className="h-auto"
            >
              <DropzoneEmptyState>
                <div className="flex flex-col items-center justify-center gap-2">
                  <SolarIcon icon="upload-bold" className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cliquez ou glissez-déposez</span>
                </div>
              </DropzoneEmptyState>
              <DropzoneContent>
                {selectedFile && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium text-gradient-light">
                      {selectedFile.name}
                    </span>
                    {isUploading && (
                      <div className="w-full space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          Upload en cours... {uploadProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </DropzoneContent>
            </Dropzone>
            {preview && (
              <Button
                variant="glass"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="mt-2"
                icon="trash-bin-bold"
              >
                Supprimer
              </Button>
            )}
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground opacity-70">{description}</p>
        )}
      </div>
    );
  }

  // Variante Cover (image de couverture)
  if (variant === "cover") {
    return (
      <div className={cn("space-y-3", className)}>
        {label && (
          <label className="text-sm font-medium text-gradient-light">{label}</label>
        )}
        {preview && (
          <AspectRatio ratio={aspectRatio || 16 / 9} className="rounded-lg overflow-hidden border border-border/50 mb-3">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <SolarIcon icon="loader-circle-bold" className="h-8 w-8 mx-auto animate-spin text-primary" />
                  <Progress value={uploadProgress} className="w-48" />
                </div>
              </div>
            )}
          </AspectRatio>
        )}
        <Dropzone
          onDrop={handleDrop}
          accept={accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {})}
          maxSize={maxSize}
          maxFiles={1}
          disabled={disabled || isUploading}
        >
          <DropzoneEmptyState>
            <div className="flex flex-col items-center justify-center gap-2">
              <SolarIcon icon="image-bold" className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium text-gradient-light">
                {preview ? "Remplacer l'image" : "Ajouter une image de couverture"}
              </span>
              <span className="text-xs text-muted-foreground">Cliquez ou glissez-déposez</span>
            </div>
          </DropzoneEmptyState>
          <DropzoneContent>
            {selectedFile && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-gradient-light">
                  {selectedFile.name}
                </span>
                {isUploading && (
                  <div className="w-full space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      Upload en cours... {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </DropzoneContent>
        </Dropzone>
        {preview && (
          <Button
            variant="glass"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            icon="trash-bin-bold"
          >
            Supprimer l'image
          </Button>
        )}
        {description && (
          <p className="text-xs text-muted-foreground opacity-70">{description}</p>
        )}
      </div>
    );
  }

  // Variante par défaut
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gradient-light">{label}</label>
      )}
      <Dropzone
        onDrop={handleDrop}
        accept={accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {})}
        maxSize={maxSize}
        maxFiles={1}
        disabled={disabled || isUploading}
      >
        <DropzoneEmptyState>
          <div className="flex flex-col items-center justify-center gap-2">
            <SolarIcon icon="upload-bold" className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-gradient-light">
              {preview ? "Remplacer l'image" : "Uploader une image"}
            </span>
            <span className="text-xs text-muted-foreground">Cliquez ou glissez-déposez</span>
          </div>
        </DropzoneEmptyState>
        <DropzoneContent>
          {selectedFile && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gradient-light">
                {selectedFile.name}
              </span>
              {isUploading && (
                <div className="w-full space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    Upload en cours... {uploadProgress}%
                  </span>
                </div>
              )}
            </div>
          )}
        </DropzoneContent>
      </Dropzone>
      {preview && variant === "default" && (
        <div className="relative">
          <AspectRatio ratio={aspectRatio || 16 / 9} className="rounded-lg overflow-hidden border border-border/50">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <SolarIcon icon="loader-circle-bold" className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </AspectRatio>
          <Button
            variant="glass"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="mt-2"
            icon="trash-bin-bold"
          >
            Supprimer
          </Button>
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground opacity-70">{description}</p>
      )}
    </div>
  );
}

