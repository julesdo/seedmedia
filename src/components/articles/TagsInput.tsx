"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  description?: string;
  placeholder?: string;
}

export function TagsInput({
  value,
  onChange,
  label = "Tags",
  description,
  placeholder = "Appuyez sur Entrée pour ajouter un tag",
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (!value.includes(newTag) && newTag.length > 0) {
        onChange([...value, newTag]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Supprimer le dernier tag si on appuie sur Backspace dans un input vide
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="flex flex-wrap gap-2 p-2 min-h-[2.5rem] border border-border/20 rounded-md bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-destructive/20"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 bg-transparent outline-none placeholder:text-muted-foreground/50 text-sm h-7 px-2"
        />
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} tag{value.length !== 1 ? "s" : ""} ajouté
          {value.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

