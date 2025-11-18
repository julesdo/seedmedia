"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CodeBlockData } from "@/components/ui/rich-editor/code-block";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-graphql";
import mermaid from "mermaid";

// Initialiser Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
});

interface CodeEditorProps {
  codeData: CodeBlockData;
  onEdit: (data: CodeBlockData) => void;
  onDelete: () => void;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
  { value: "docker", label: "Docker" },
  { value: "graphql", label: "GraphQL" },
  { value: "mermaid", label: "Mermaid" },
];

export function CodeEditor({ codeData, onEdit, onDelete }: CodeEditorProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [localCodeData, setLocalCodeData] = useState<CodeBlockData>({
    code: codeData.code || "",
    language: codeData.language || "javascript",
    mode: codeData.mode || "split",
  });

  const mermaidRefSplit = useRef<HTMLDivElement>(null);
  const mermaidRefFull = useRef<HTMLDivElement>(null);

  // Synchroniser avec les props si elles changent de l'extérieur
  useEffect(() => {
    const currentStr = JSON.stringify(localCodeData);
    const newStr = JSON.stringify(codeData);
    if (currentStr !== newStr) {
      setLocalCodeData(codeData);
    }
  }, [codeData]);

  // Auto-save avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onEdit(localCodeData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localCodeData, onEdit]);

  // Détecter si c'est du Mermaid
  const isMermaid = localCodeData.language === "mermaid";

  // Rendu du code avec syntax highlighting
  const highlightedCode = useMemo(() => {
    if (!localCodeData.code) return "";

    if (isMermaid) {
      return localCodeData.code; // Mermaid sera rendu séparément
    }

    try {
      const grammar = Prism.languages[localCodeData.language] || Prism.languages.javascript;
      return Prism.highlight(localCodeData.code, grammar, localCodeData.language);
    } catch (error) {
      console.error("Error highlighting code:", error);
      return localCodeData.code;
    }
  }, [localCodeData.code, localCodeData.language, isMermaid]);

  // Rendu du diagramme Mermaid - fonction helper
  const renderMermaid = useCallback((ref: React.RefObject<HTMLDivElement>, id: string) => {
    if (isMermaid && ref.current && localCodeData.code) {
      ref.current.innerHTML = ""; // Clear previous content

      mermaid
        .render(id, localCodeData.code)
        .then((result) => {
          if (ref.current) {
            ref.current.innerHTML = result.svg;
          }
        })
        .catch((error) => {
          console.error("Error rendering Mermaid:", error);
          if (ref.current) {
            ref.current.innerHTML = `<div class="text-destructive p-4 text-sm">Erreur de rendu Mermaid: ${error.message}</div>`;
          }
        });
    } else if (isMermaid && ref.current && !localCodeData.code) {
      // Si pas de code, afficher un message
      ref.current.innerHTML = `<div class="text-muted-foreground p-4 text-sm text-center">Écrivez votre diagramme Mermaid ci-dessus</div>`;
    }
  }, [isMermaid, localCodeData.code]);

  // Rendu du diagramme Mermaid pour le mode split
  useEffect(() => {
    if (localCodeData.mode === "split") {
      const id = `mermaid-split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      renderMermaid(mermaidRefSplit, id);
    }
  }, [localCodeData.mode, renderMermaid]);

  // Rendu du diagramme Mermaid pour le mode full
  useEffect(() => {
    if (localCodeData.mode === "full") {
      const id = `mermaid-full-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      renderMermaid(mermaidRefFull, id);
    }
  }, [localCodeData.mode, renderMermaid]);

  const handleCodeChange = (value: string) => {
    setLocalCodeData((prev) => ({ ...prev, code: value }));
  };

  const handleLanguageChange = (value: string) => {
    setLocalCodeData((prev) => ({ ...prev, language: value }));
  };

  const handleModeChange = (mode: "split" | "full") => {
    setLocalCodeData((prev) => ({ ...prev, mode }));
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={localCodeData.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={localCodeData.mode === "split" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleModeChange("split")}
              >
                Split
              </Button>
              <Button
                variant={localCodeData.mode === "full" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleModeChange("full")}
              >
                Full
              </Button>
            </div>
          </div>
          <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {isConfigOpen ? "Masquer" : "Config"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4">
        <div className={cn(
          "flex gap-4",
          localCodeData.mode === "split" && !isMermaid ? "flex-row" : "flex-col",
          isMermaid && "flex-col"
        )}>
          {/* Zone d'édition du code - affichée en mode split ou full */}
          {(localCodeData.mode === "split" || localCodeData.mode === "full") && (
            <div className={cn(
              "flex-1 min-h-0",
              localCodeData.mode === "split" && !isMermaid ? "w-1/2" : "w-full"
            )}>
              <Textarea
                value={localCodeData.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="font-mono text-sm h-full min-h-[300px] resize-none bg-background/50 dark:bg-background/30"
                placeholder="Écrivez votre code ici..."
              />
            </div>
          )}

          {/* Zone de preview - affichée seulement en mode split */}
          {localCodeData.mode === "split" && (
            <div className={cn(
              "flex-1 min-h-0 overflow-auto",
              !isMermaid ? "w-1/2" : "w-full"
            )}>
              {isMermaid ? (
                <div
                  ref={mermaidRefSplit}
                  className="w-full min-h-[300px] flex items-center justify-center bg-background/50 rounded-lg p-4 overflow-auto"
                />
              ) : (
                <pre className="bg-background/80 dark:bg-background/60 rounded-lg p-4 overflow-auto h-full min-h-[300px] border border-border/20">
                  <code
                    className={`language-${localCodeData.language} block`}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              )}
            </div>
          )}

          {/* En mode full, afficher aussi la preview Mermaid si c'est du Mermaid */}
          {localCodeData.mode === "full" && isMermaid && (
            <div className="w-full min-h-[300px] overflow-auto mt-4">
              <div
                ref={mermaidRefFull}
                className="w-full min-h-[300px] flex items-center justify-center bg-background/50 rounded-lg p-4 overflow-auto"
              />
            </div>
          )}
        </div>

        {/* Configuration collapsible */}
        <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <AnimatePresence>
            {isConfigOpen && (
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-border/20"
                >
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Mode d'affichage: {localCodeData.mode === "split" ? "Code + Preview côte à côte" : "Code uniquement (avec preview Mermaid si applicable)"}
                    </p>
                    {isMermaid && (
                      <p className="text-xs text-muted-foreground">
                        Le diagramme Mermaid sera affiché automatiquement en dessous du code
                      </p>
                    )}
                  </div>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

