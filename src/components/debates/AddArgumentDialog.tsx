"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddArgumentDialogProps {
  debateId: Id<"debates">;
  position: "for" | "against";
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function AddArgumentDialog({
  debateId,
  position,
  trigger,
  onSuccess,
}: AddArgumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState("");
  const [loading, setLoading] = useState(false);

  const addArgument = useMutation(api.debates.addDebatArgument);

  const handleAddSource = () => {
    if (newSource.trim() && !sources.includes(newSource.trim())) {
      setSources([...sources, newSource.trim()]);
      setNewSource("");
    }
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Le titre et le contenu sont obligatoires");
      return;
    }

    setLoading(true);

    try {
      await addArgument({
        debatId: debateId,
        position,
        title: title.trim(),
        content: content.trim(),
        sources: sources.length > 0 ? sources : undefined,
      });

      toast.success("Argument ajouté avec succès !");
      setTitle("");
      setContent("");
      setSources([]);
      setNewSource("");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de l'argument:", error);
      toast.error(error.message || "Erreur lors de l'ajout de l'argument");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Ajouter un argument {position === "for" ? "POUR" : "CONTRE"}
          </DialogTitle>
          <DialogDescription>
            Formulez votre argument de manière claire et structurée pour contribuer au débat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre de l'argument <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: L'open source favorise la transparence et la sécurité"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Contenu */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Contenu de l'argument <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Développez votre argument de manière détaillée..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
            />
            <p className="text-sm text-muted-foreground">
              Soyez précis et étayez votre argument avec des faits et des exemples.
            </p>
          </div>

          {/* Sources */}
          <div className="space-y-2">
            <Label htmlFor="sources">Sources (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                id="sources"
                placeholder="https://exemple.com/source"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSource();
                  }
                }}
              />
              <Button type="button" onClick={handleAddSource} variant="outline">
                <SolarIcon icon="add-circle-bold" className="h-4 w-4" />
              </Button>
            </div>
            {sources.length > 0 && (
              <div className="space-y-1">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate flex-1"
                    >
                      {source}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSource(index)}
                    >
                      <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <SolarIcon icon="loading-bold" className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                  Publier l'argument
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

