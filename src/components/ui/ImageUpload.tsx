"use client";

import * as React from "react";
import { useState, useCallback, useRef } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  onStorageIdChange?: (storageId: string | null) => void;
  accept?: string[];
  maxSize?: number;
  aspectRatio?: number;
  label?: string;
  description?: string;
  className?: string;
  variant?: "avatar" | "cover" | "default";
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
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    },
  });

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Créer une preview locale immédiatement
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload le fichier
      await uploadFile(file);
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        handleFileSelect(imageFile);
      }
    },
    [disabled, isUploading, handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input pour permettre de sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
    onStorageIdChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Variante Avatar
  if (variant === "avatar") {
    return (
      <div className={cn("space-y-3", className)}>
        {label && <Label>{label}</Label>}
        
        <div className="flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {preview ? (
                <img 
                  src={preview} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <SolarIcon 
                  icon="user-bold" 
                  className="h-10 w-10 text-muted-foreground" 
                />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <SolarIcon 
                      icon="loader-circle-bold" 
                      className="h-6 w-6 animate-spin text-primary mx-auto" 
                    />
                    <Progress value={uploadProgress} className="w-16 h-1" />
                  </div>
                </div>
              )}
            </div>
            {preview && !isUploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                aria-label="Supprimer l'avatar"
              >
                <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept.join(",")}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              disabled={disabled || isUploading}
              className="w-full"
            >
              <SolarIcon icon="upload-bold" className="h-4 w-4 mr-2" />
              {preview ? "Remplacer" : "Choisir une image"}
            </Button>
            {description && (
              <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Variante Cover (image de couverture)
  if (variant === "cover") {
    return (
      <div className={cn("space-y-3", className)}>
        {label && <Label>{label}</Label>}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* Zone de drop/upload */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
            disabled && "opacity-50 cursor-not-allowed",
            isUploading && "cursor-wait"
          )}
        >
          {preview ? (
            <AspectRatio ratio={aspectRatio || 16 / 9} className="rounded-lg overflow-hidden">
              <img 
                src={preview} 
                alt="Cover" 
                className="w-full h-full object-cover" 
              />
              {isUploading && (
                <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <SolarIcon 
                      icon="loader-circle-bold" 
                      className="h-8 w-8 animate-spin text-primary mx-auto" 
                    />
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="w-48 h-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploadProgress}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!isUploading && (
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <SolarIcon icon="upload-bold" className="h-8 w-8 text-white mx-auto" />
                    <p className="text-sm font-medium text-white">
                      Cliquez pour remplacer
                    </p>
                  </div>
                </div>
              )}
            </AspectRatio>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className={cn(
                "rounded-full p-4 mb-4 transition-colors",
                isDragging ? "bg-primary/20" : "bg-muted"
              )}>
                <SolarIcon 
                  icon={isDragging ? "upload-bold" : "image-bold"} 
                  className={cn(
                    "h-8 w-8 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} 
                />
              </div>
              <p className="text-sm font-medium mb-1">
                {isDragging ? "Déposez l'image ici" : "Cliquez ou glissez-déposez une image"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WEBP (max {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {preview && !isUploading && (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={disabled}
            >
              <SolarIcon icon="refresh-bold" className="h-4 w-4 mr-2" />
              Remplacer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-destructive hover:text-destructive"
            >
              <SolarIcon icon="trash-bin-trash-bold" className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }

  // Variante par défaut
  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label>{label}</Label>}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Zone de drop/upload */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "cursor-wait"
        )}
      >
        {preview ? (
          <div className="relative">
            <AspectRatio ratio={aspectRatio || 16 / 9} className="rounded-lg overflow-hidden">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover" 
              />
              {isUploading && (
                <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <SolarIcon 
                      icon="loader-circle-bold" 
                      className="h-8 w-8 animate-spin text-primary mx-auto" 
                    />
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="w-48 h-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploadProgress}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!isUploading && (
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <SolarIcon icon="upload-bold" className="h-8 w-8 text-white mx-auto" />
                    <p className="text-sm font-medium text-white">
                      Cliquez pour remplacer
                    </p>
                  </div>
                </div>
              )}
            </AspectRatio>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className={cn(
              "rounded-full p-4 mb-4 transition-colors",
              isDragging ? "bg-primary/20" : "bg-muted"
            )}>
              <SolarIcon 
                icon={isDragging ? "upload-bold" : "image-bold"} 
                className={cn(
                  "h-8 w-8 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} 
              />
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragging ? "Déposez l'image ici" : "Cliquez ou glissez-déposez une image"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WEBP (max {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {preview && !isUploading && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled}
          >
            <SolarIcon icon="refresh-bold" className="h-4 w-4 mr-2" />
            Remplacer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="text-destructive hover:text-destructive"
          >
            <SolarIcon icon="trash-bin-trash-bold" className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      )}

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
