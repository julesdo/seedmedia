"use client";

import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PexelsPhoto {
  id: number;
  url: string;
  thumbnail: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
  width: number;
  height: number;
}

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  onStorageIdChange?: (storageId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  accept?: string[];
  maxSize?: number;
}

export function ImagePicker({
  value,
  onChange,
  onStorageIdChange,
  open,
  onOpenChange,
  title = "Sélectionner une image",
  description = "Recherchez sur Pexels ou uploadez votre propre image",
  accept = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxSize = 5 * 1024 * 1024, // 5MB
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<"pexels" | "upload">("pexels");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchPexels = useAction(api.images.searchPexelsImages);
  const { uploadFile, isUploading } = useImageUpload({
    onUploadSuccess: (url, storageId) => {
      onChange(url);
      if (storageId && onStorageIdChange) {
        onStorageIdChange(storageId);
      }
      onOpenChange(false);
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Veuillez entrer un terme de recherche");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchPexels({
        query: searchQuery.trim(),
        perPage: 20,
        orientation: "landscape",
      });
      setPhotos(result.photos || []);
      if (result.photos.length === 0) {
        toast.info("Aucune image trouvée");
      }
    } catch (error: any) {
      toast.error(`Erreur lors de la recherche: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPexelsImage = (photo: PexelsPhoto) => {
    setSelectedPhoto(photo);
    onChange(photo.url);
    toast.success("Image sélectionnée");
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type
    if (!accept.includes(file.type)) {
      const acceptedTypes = accept.map((t) => t.split("/")[1]).join(", ");
      toast.error(`Type de fichier non accepté. Types acceptés: ${acceptedTypes}`);
      return;
    }

    // Validation de la taille
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      toast.error(`Fichier trop volumineux. Taille max: ${maxSizeMB}MB`);
      return;
    }

    await uploadFile(file);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pexels" | "upload")} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pexels">
              <SolarIcon icon="image-bold" className="size-4 mr-2" />
              Pexels
            </TabsTrigger>
            <TabsTrigger value="upload">
              <SolarIcon icon="upload-bold" className="size-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pexels" className="flex-1 flex flex-col overflow-hidden mt-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Rechercher des images (ex: nature, city, technology...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <>
                    <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <SolarIcon icon="magnifer-bold" className="size-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-video w-full" />
                  ))}
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <Card
                      key={photo.id}
                      className={cn(
                        "cursor-pointer transition-all hover:ring-2 hover:ring-primary overflow-hidden",
                        selectedPhoto?.id === photo.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleSelectPexelsImage(photo)}
                    >
                      <CardContent className="p-0">
                        <div className="relative aspect-video">
                          <img
                            src={photo.thumbnail}
                            alt={photo.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {selectedPhoto?.id === photo.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <SolarIcon icon="check-circle-bold" className="size-8 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 text-xs text-muted-foreground truncate">
                          Par {photo.photographer}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <SolarIcon icon="image-bold" className="size-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune image trouvée</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Essayez avec d'autres mots-clés
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <SolarIcon icon="magnifer-bold" className="size-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Recherchez des images sur Pexels</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Entrez un terme de recherche ci-dessus
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 flex flex-col overflow-hidden mt-4">
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12">
              <input
                ref={fileInputRef}
                type="file"
                accept={accept.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
              <SolarIcon icon="upload-bold" className="size-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Glissez-déposez votre image ici</p>
              <p className="text-sm text-muted-foreground mb-4">
                ou cliquez pour sélectionner un fichier
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
              >
                {isUploading ? (
                  <>
                    <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <SolarIcon icon="folder-bold" className="size-4 mr-2" />
                    Sélectionner un fichier
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Formats acceptés: {accept.map((t) => t.split("/")[1]).join(", ")}
                <br />
                Taille max: {(maxSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

