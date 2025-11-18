"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SolarIcon } from "@/components/icons/SolarIcon";

interface LinkDialogProps {
  onInsert: (url: string, text: string) => void;
}

export function LinkDialog({ onInsert }: LinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleInsert = () => {
    if (url.trim()) {
      onInsert(url.trim(), text.trim() || url.trim());
      setUrl("");
      setText("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="glass"
          size="sm"
          className="h-8 w-8 p-0"
          title="Insérer un lien"
        >
          <span className="text-sm">🔗</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-gradient-light">Insérer un lien</DialogTitle>
          <DialogDescription>
            Ajoutez un lien vers une source externe
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-url" className="text-sm font-medium text-foreground">
              URL
            </Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInsert();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-text" className="text-sm font-medium text-foreground">
              Texte du lien (optionnel)
            </Label>
            <Input
              id="link-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Texte à afficher"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInsert();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="glass"
              onClick={handleInsert}
              disabled={!url.trim()}
            >
              Insérer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

