"use client";

import { useState, useCallback, useEffect } from "react";
import { SerializedEditorState } from "lexical";
import { Editor } from "@/components/blocks/editor-00/editor";
import { Label } from "@/components/ui/label";

interface RichTextEditorProps {
  value?: string; // JSON stringifié de l'état de l'éditeur
  onChange: (content: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label = "Contenu",
  description,
  placeholder = "Commencez à écrire votre article...",
}: RichTextEditorProps) {
  const [serializedState, setSerializedState] = useState<
    SerializedEditorState | undefined
  >(value ? JSON.parse(value) : undefined);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setSerializedState(parsed);
      } catch {
        // Ignorer les erreurs de parsing
      }
    }
  }, [value]);

  const handleSerializedChange = useCallback(
    (serialized: SerializedEditorState) => {
      setSerializedState(serialized);
      onChange(JSON.stringify(serialized));
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="min-h-[400px]">
        <Editor
          editorSerializedState={serializedState}
          onSerializedChange={handleSerializedChange}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Utilisez les raccourcis clavier pour formater votre texte (Ctrl+B pour
        gras, Ctrl+I pour italique, etc.)
      </p>
    </div>
  );
}

