'use client';

import * as React from 'react';

import { formatCodeBlock, isLangSupported } from '@platejs/code-block';
import { BracesIcon, Check, CheckIcon, CopyIcon, EyeIcon, CodeIcon, SplitIcon, RotateCcwIcon, UploadIcon, XIcon } from 'lucide-react';
import { type TCodeBlockElement, type TCodeSyntaxLeaf, NodeApi } from 'platejs';
import {
  type PlateElementProps,
  type PlateLeafProps,
  PlateElement,
  PlateLeaf,
} from 'platejs/react';
import { useEditorRef, useElement, useReadOnly } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Import Mermaid dynamiquement
let mermaid: any = null;
if (typeof window !== 'undefined') {
  import('mermaid').then((m) => {
    mermaid = m.default;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
    });
  });
}

// Import du composant MoleculeViewer qui gère Molstar
import { MoleculeViewer } from './molecule-viewer';
// Import du composant VegaViewer pour les graphiques
import { VegaViewer } from './vega-viewer';

type MermaidDisplayMode = 'split' | 'diagram' | 'code';
type MoleculeDisplayMode = 'split' | 'molecule' | 'code';
type VegaDisplayMode = 'split' | 'graph' | 'code';

export function CodeBlockElement(props: PlateElementProps<TCodeBlockElement>) {
  const { editor, element } = props;
  const isMermaid = element.lang === 'mermaid';
  // Formats moléculaires supportés (uniquement SDF et PDB)
  const isMolecule = ['molecule', 'smiles', 'sdf', 'pdb'].includes(element.lang || '');
  // Formats Vega supportés
  const isVega = ['vega', 'vega-lite'].includes(element.lang || '');
  
  // Gestion des fichiers CSV pour Vega
  const [csvFiles, setCsvFiles] = React.useState<Array<{ id: string; name: string; data: any[] }>>(
    element.meta?.csvFiles || []
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const mermaidRef = React.useRef<HTMLDivElement>(null);
  const mermaidContainerRef = React.useRef<HTMLDivElement>(null);
  const moleculeRef = React.useRef<HTMLDivElement>(null);
  const moleculeContainerRef = React.useRef<HTMLDivElement>(null);
  const vegaRef = React.useRef<HTMLDivElement>(null);
  const codeContent = NodeApi.string(element);
  const readOnly = useReadOnly();
  
  // Mode d'affichage Mermaid (stocké dans les meta du node)
  const [displayMode, setDisplayMode] = React.useState<MermaidDisplayMode>(
    (element.meta?.mermaidMode as MermaidDisplayMode) || 'split'
  );
  
  // Mode d'affichage Molecule (stocké dans les meta du node)
  const [moleculeDisplayMode, setMoleculeDisplayMode] = React.useState<MoleculeDisplayMode>(
    (element.meta?.moleculeMode as MoleculeDisplayMode) || 'split'
  );
  
  // Mode d'affichage Vega (stocké dans les meta du node)
  const [vegaDisplayMode, setVegaDisplayMode] = React.useState<VegaDisplayMode>(
    (element.meta?.vegaMode as VegaDisplayMode) || 'split'
  );

  // États pour le zoom et le pan Mermaid (utiliser refs pour éviter les re-renders)
  const zoomRef = React.useRef(1);
  const positionRef = React.useRef({ x: 0, y: 0 });
  const isDraggingRef = React.useRef(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const containerElementRef = React.useRef<HTMLDivElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const svgContentRef = React.useRef<string | null>(null);
  const lastZoomRef = React.useRef(1);
  
  // États pour les molécules
  const moleculeZoomRef = React.useRef(1);
  const moleculePositionRef = React.useRef({ x: 0, y: 0 });
  const moleculeIsDraggingRef = React.useRef(false);
  const moleculeDragStartRef = React.useRef({ x: 0, y: 0 });
  const moleculeContainerElementRef = React.useRef<HTMLDivElement | null>(null);
  const moleculeViewerRef = React.useRef<any>(null);

  // Fonction pour appliquer la transformation avec requestAnimationFrame pour la fluidité
  const applyTransform = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (mermaidContainerRef.current && mermaidRef.current) {
        const svg = mermaidRef.current.querySelector('svg') as SVGSVGElement | null;
        
        if (svg) {
          // Au lieu de scaler le conteneur, ajuster la taille native du SVG pour éviter le flou
          const originalWidth = svg.getAttribute('data-original-width');
          const originalHeight = svg.getAttribute('data-original-height');
          
          // Stocker les dimensions originales si ce n'est pas déjà fait
          if (!originalWidth || !originalHeight) {
            const width = svg.width.baseVal.value || parseFloat(svg.getAttribute('width') || '0');
            const height = svg.height.baseVal.value || parseFloat(svg.getAttribute('height') || '0');
            if (width && height) {
              svg.setAttribute('data-original-width', width.toString());
              svg.setAttribute('data-original-height', height.toString());
            }
          }
          
          // Ajuster la taille du SVG directement au lieu de scaler
          if (originalWidth && originalHeight) {
            const newWidth = parseFloat(originalWidth) * zoomRef.current;
            const newHeight = parseFloat(originalHeight) * zoomRef.current;
            svg.setAttribute('width', newWidth.toString());
            svg.setAttribute('height', newHeight.toString());
          }
          
          // Optimisations pour le rendu net
          svg.style.imageRendering = 'crisp-edges';
          svg.style.shapeRendering = 'geometricPrecision';
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
        
        // Utiliser seulement translate3d pour le déplacement (pas de scale)
        mermaidContainerRef.current.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0)`;
        mermaidContainerRef.current.style.transformOrigin = 'center center';
        // Optimisations pour le rendu
        mermaidContainerRef.current.style.willChange = 'transform';
        mermaidContainerRef.current.style.backfaceVisibility = 'hidden';
        mermaidContainerRef.current.style.perspective = '1000px';
      }
    });
  }, []);

  // Fonction de reset
  const handleResetView = React.useCallback(() => {
    zoomRef.current = 1;
    positionRef.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

  // Gestion du zoom avec la molette et du drag pour Mermaid (comme Figma) - avec event listeners directs
  React.useEffect(() => {
    if (!isMermaid || displayMode === 'code' || !containerElementRef.current) return;

    const container = containerElementRef.current;

    const handleWheel = (e: WheelEvent) => {
      // Empêcher le scroll de la page
      e.preventDefault();
      e.stopPropagation();
      
      // Zoom centré sur la position de la souris
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(3, zoomRef.current * zoomFactor));
      
      // Ajuster la position pour zoomer vers la souris
      const zoomChange = newZoom / zoomRef.current;
      positionRef.current.x = mouseX - (mouseX - positionRef.current.x) * zoomChange;
      positionRef.current.y = mouseY - (mouseY - positionRef.current.y) * zoomChange;
      
      zoomRef.current = newZoom;
      applyTransform();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      
      // Empêcher la sélection de texte
      e.preventDefault();
      e.stopPropagation();
      
      isDraggingRef.current = true;
      const rect = container.getBoundingClientRect();
      dragStartRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
      
      // Changer le curseur
      container.style.cursor = 'grabbing';
    };

    // Ajouter les event listeners avec capture et non-passif
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    container.addEventListener('mousedown', handleMouseDown, { passive: false, capture: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isMermaid, displayMode, applyTransform]);
  
  // Callback pour stocker la référence du viewer Molstar
  const handleViewerReady = React.useCallback((viewer: any) => {
    moleculeViewerRef.current = viewer;
  }, []);
  
  // Fonction pour obtenir la couleur d'un atome
  function getAtomColor(symbol: string): { r: number; g: number; b: number } {
    const colors: Record<string, { r: number; g: number; b: number }> = {
      'H': { r: 1.0, g: 1.0, b: 1.0 },
      'C': { r: 0.2, g: 0.2, b: 0.2 },
      'N': { r: 0.0, g: 0.0, b: 1.0 },
      'O': { r: 1.0, g: 0.0, b: 0.0 },
      'F': { r: 0.0, g: 1.0, b: 0.0 },
      'Cl': { r: 0.0, g: 1.0, b: 0.0 },
      'Br': { r: 0.6, g: 0.2, b: 0.0 },
      'I': { r: 0.6, g: 0.0, b: 0.6 },
      'P': { r: 1.0, g: 0.5, b: 0.0 },
      'S': { r: 1.0, g: 1.0, b: 0.0 },
    };
    return colors[symbol] || { r: 0.5, g: 0.5, b: 0.5 };
  }
  
  // Sauvegarder le mode molécule dans les meta du node
  const handleMoleculeModeChange = (mode: MoleculeDisplayMode) => {
    setMoleculeDisplayMode(mode);
    editor.tf.setNodes<TCodeBlockElement>(
      { meta: { ...element.meta, moleculeMode: mode } },
      { at: element }
    );
  };
  
  // Fonction de reset pour les molécules (3Dmol.js)
  const handleMoleculeResetView = React.useCallback(() => {
    if (moleculeViewerRef.current) {
      // 3Dmol.js a une méthode zoomTo pour réinitialiser la vue
      moleculeViewerRef.current.zoomTo();
      moleculeViewerRef.current.render();
    }
    moleculeZoomRef.current = 1;
    moleculePositionRef.current = { x: 0, y: 0 };
  }, []);

  // Rendu du diagramme Mermaid (optimisé pour éviter les re-renders)
  React.useEffect(() => {
    if (isMermaid && mermaidRef.current && codeContent && mermaid && displayMode !== 'code') {
      const id = `mermaid-${element.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      mermaidRef.current.innerHTML = ''; // Clear previous content

      mermaid
        .render(id, codeContent)
        .then((result: { svg: string }) => {
          if (mermaidRef.current) {
            // Stocker le contenu SVG pour pouvoir le re-rendre si nécessaire
            svgContentRef.current = result.svg;
            mermaidRef.current.innerHTML = result.svg;
            
            // Réinitialiser le zoom et la position après le rendu
            zoomRef.current = 1;
            lastZoomRef.current = 1;
            positionRef.current = { x: 0, y: 0 };
            applyTransform();
          }
        })
        .catch((error: Error) => {
          console.error('Error rendering Mermaid:', error);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="text-destructive p-4 text-sm">Erreur de rendu Mermaid: ${error.message}</div>`;
          }
        });
    } else if (isMermaid && mermaidRef.current && !codeContent && displayMode !== 'code') {
      mermaidRef.current.innerHTML = `<div class="text-muted-foreground p-4 text-sm text-center">Écrivez votre diagramme Mermaid ci-dessus</div>`;
      svgContentRef.current = null;
    }
  }, [isMermaid, codeContent, element.id, displayMode, applyTransform]);

  // Sauvegarder le mode dans les meta du node
  const handleModeChange = (mode: MermaidDisplayMode) => {
    setDisplayMode(mode);
    editor.tf.setNodes<TCodeBlockElement>(
      { meta: { ...element.meta, mermaidMode: mode } },
      { at: element }
    );
  };
  
  // Sauvegarder le mode Vega dans les meta du node
  const handleVegaModeChange = (mode: VegaDisplayMode) => {
    setVegaDisplayMode(mode);
    editor.tf.setNodes<TCodeBlockElement>(
      { meta: { ...element.meta, vegaMode: mode } },
      { at: element }
    );
  };
  
  // Gérer l'upload de fichiers CSV
  const handleCsvUpload = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles: Array<{ id: string; name: string; data: any[] }> = [];
    
    for (const file of Array.from(files)) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        console.warn(`Le fichier ${file.name} n'est pas un CSV, ignoré`);
        continue;
      }
      
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) continue;
        
        // Parser le CSV de manière robuste (gère les guillemets, virgules dans les valeurs, etc.)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Double guillemet = guillemet échappé
                current += '"';
                i++; // Skip next quote
              } else {
                // Toggle quote state
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // Fin du champ
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          
          // Ajouter le dernier champ
          result.push(current.trim());
          return result;
        };
        
        const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
        const data = lines.slice(1)
          .filter(line => line.trim()) // Ignorer les lignes vides
          .map(line => {
            const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              // Essayer de convertir en nombre si possible
              const value = values[index] || '';
              const numValue = Number(value);
              row[header] = isNaN(numValue) || value === '' ? value : numValue;
            });
            return row;
          });
        
        const fileId = `csv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        newFiles.push({
          id: fileId,
          name: file.name,
          data,
        });
        
        // Sauvegarder dans localStorage
        const storageKey = `vega-csv-${element.id || 'temp'}-${fileId}`;
        localStorage.setItem(storageKey, JSON.stringify({ name: file.name, data }));
      } catch (error) {
        console.error(`Erreur lors du chargement du fichier ${file.name}:`, error);
      }
    }
    
    if (newFiles.length > 0) {
      const updatedFiles = [...csvFiles, ...newFiles];
      setCsvFiles(updatedFiles);
      
      // Sauvegarder dans les meta du node
      editor.tf.setNodes<TCodeBlockElement>(
        { meta: { ...element.meta, csvFiles: updatedFiles } },
        { at: element }
      );
    }
    
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [csvFiles, element, editor]);
  
  // Supprimer un fichier CSV
  const handleRemoveCsv = React.useCallback((fileId: string) => {
    const updatedFiles = csvFiles.filter(f => f.id !== fileId);
    setCsvFiles(updatedFiles);
    
    // Supprimer de localStorage
    const storageKey = `vega-csv-${element.id || 'temp'}-${fileId}`;
    localStorage.removeItem(storageKey);
    
    // Mettre à jour les meta
    editor.tf.setNodes<TCodeBlockElement>(
      { meta: { ...element.meta, csvFiles: updatedFiles } },
      { at: element }
    );
  }, [csvFiles, element, editor]);
  
  // Charger les fichiers CSV depuis localStorage au montage
  React.useEffect(() => {
    if (isVega && element.id && csvFiles.length === 0 && element.meta?.csvFiles) {
      // Charger depuis localStorage si disponible
      const loadedFiles = element.meta.csvFiles.map((file: any) => {
        const storageKey = `vega-csv-${element.id}-${file.id}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            return { ...file, data: parsed.data };
          } catch (e) {
            console.error('Erreur lors du chargement du CSV depuis localStorage:', e);
          }
        }
        return file;
      });
      
      if (loadedFiles.length > 0) {
        setCsvFiles(loadedFiles);
      }
    }
  }, [isVega, element.id]);

  // Gestion globale du mouse move et mouse up pour une meilleure fluidité
  React.useEffect(() => {
    if (!isMermaid || displayMode === 'code') return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        
        positionRef.current = {
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        };
        applyTransform();
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = false;
        
        if (containerElementRef.current) {
          containerElementRef.current.style.cursor = 'grab';
        }
      }
    };

    // Toujours écouter, mais ne traiter que si on drag
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false, capture: true });
    document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false, capture: true });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    };
  }, [isMermaid, displayMode, applyTransform]);

  return (
    <PlateElement
      className="py-1 **:[.hljs-addition]:bg-[#f0fff4] **:[.hljs-addition]:text-[#22863a] dark:**:[.hljs-addition]:bg-[#3c5743] dark:**:[.hljs-addition]:text-[#ceead5] **:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#005cc5] dark:**:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#6596cf] **:[.hljs-built\\\\_in,.hljs-symbol]:text-[#e36209] dark:**:[.hljs-built\\\\_in,.hljs-symbol]:text-[#c3854e] **:[.hljs-bullet]:text-[#735c0f] **:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] dark:**:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] **:[.hljs-deletion]:bg-[#ffeef0] **:[.hljs-deletion]:text-[#b31d28] dark:**:[.hljs-deletion]:bg-[#473235] dark:**:[.hljs-deletion]:text-[#e7c7cb] **:[.hljs-emphasis]:italic **:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#d73a49] dark:**:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#ee6960] **:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#22863a] dark:**:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#36a84f] **:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#032f62] dark:**:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#3593ff] **:[.hljs-section]:font-bold **:[.hljs-section]:text-[#005cc5] dark:**:[.hljs-section]:text-[#61a5f2] **:[.hljs-strong]:font-bold **:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#6f42c1] dark:**:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#a77bfa]"
      {...props}
    >
      <div className={cn(
        'relative rounded-md bg-muted/50',
        (isMermaid && displayMode === 'split') || (isMolecule && moleculeDisplayMode === 'split') || (isVega && vegaDisplayMode === 'split') ? 'flex gap-4 overflow-hidden' : '',
        (isMermaid && displayMode === 'diagram') || (isMolecule && moleculeDisplayMode === 'molecule') || (isVega && vegaDisplayMode === 'graph') ? 'hidden' : ''
      )}>
        {/* Code block */}
        {((isMermaid && displayMode !== 'diagram') || (isMolecule && moleculeDisplayMode !== 'molecule')) || (!isMermaid && !isMolecule) ? (
          <div className={cn(
            'relative',
            ((isMermaid && displayMode === 'split') || (isMolecule && moleculeDisplayMode === 'split') || (isVega && vegaDisplayMode === 'split')) && 'flex-1 min-w-0 overflow-hidden',
            ((isMermaid && displayMode === 'split') || (isMolecule && moleculeDisplayMode === 'split') || (isVega && vegaDisplayMode === 'split')) && 'max-w-[50%]'
          )}>
            <pre className="overflow-x-auto overflow-y-auto p-8 pr-4 font-mono text-sm leading-[normal] [tab-size:2] print:break-inside-avoid w-full h-full">
              <code className="block whitespace-pre">{props.children}</code>
            </pre>

            <div
              className="absolute top-1 right-1 z-10 flex gap-0.5 select-none"
              contentEditable={false}
            >
              {isLangSupported(element.lang) && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 text-xs"
                  onClick={() => formatCodeBlock(editor, { element })}
                  title="Format code"
                >
                  <BracesIcon className="!size-3.5 text-muted-foreground" />
                </Button>
              )}

              <CodeBlockCombobox />

              {isMermaid && !readOnly && (
                <MermaidModeSelector
                  currentMode={displayMode}
                  onModeChange={handleModeChange}
                />
              )}
              
              {isMolecule && !readOnly && (
                <MoleculeModeSelector
                  currentMode={moleculeDisplayMode}
                  onModeChange={handleMoleculeModeChange}
                />
              )}
              
              {isVega && !readOnly && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleCsvUpload}
                    className="hidden"
                    id={`csv-upload-${element.id}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-xs text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    title="Uploader des fichiers CSV"
                  >
                    <UploadIcon className="size-3.5" />
                  </Button>
                  <VegaModeSelector
                    currentMode={vegaDisplayMode}
                    onModeChange={handleVegaModeChange}
                  />
                </>
              )}

              <CopyButton
                size="icon"
                variant="ghost"
                className="size-6 gap-1 text-xs text-muted-foreground"
                value={() => NodeApi.string(element)}
              />
            </div>
          </div>
        ) : null}

        {/* Graphique Vega - mode split (côte à côte) */}
        {isVega && vegaDisplayMode === 'split' && (
          <div className="flex-1 min-w-0 rounded-md border border-border bg-background p-4 flex flex-col" style={{ minWidth: '300px', maxWidth: '50%' }}>
            <div className="mb-2 flex items-center justify-between shrink-0">
              <div className="text-xs font-medium text-muted-foreground">
                Aperçu du graphique Vega
              </div>
            </div>
            {csvFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {csvFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md"
                  >
                    <span className="text-muted-foreground">{file.name}</span>
                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveCsv(file.id)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Supprimer le fichier"
                      >
                        <XIcon className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div
              ref={vegaRef}
              className="flex-1 min-h-0 flex items-center justify-center overflow-auto relative"
              style={{ minHeight: '300px' }}
            >
              {codeContent && (
                <VegaViewer
                  codeContent={codeContent}
                  containerRef={vegaRef}
                  format={element.lang as 'vega' | 'vega-lite'}
                  csvFiles={csvFiles}
                />
              )}
            </div>
          </div>
        )}

        {/* Molécule 3D - mode split (côte à côte) */}
        {isMolecule && moleculeDisplayMode === 'split' && (
          <div className="flex-1 min-w-0 rounded-md border border-border bg-background p-4 flex flex-col" style={{ minWidth: '300px', maxWidth: '50%' }}>
            <div className="mb-2 flex items-center justify-between shrink-0">
              <div className="text-xs font-medium text-muted-foreground">
                Aperçu 3D (rotation: clic-glisser, zoom: molette)
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleMoleculeResetView}
                title="Réinitialiser la vue"
              >
                <RotateCcwIcon className="size-3" />
              </Button>
            </div>
            <div
              ref={moleculeContainerElementRef}
              className="flex-1 min-h-0 flex items-center justify-center overflow-hidden relative cursor-default select-none"
              onContextMenu={(e) => e.preventDefault()}
              contentEditable={false}
              style={{ touchAction: 'none', userSelect: 'none', width: '100%', height: '400px', maxHeight: '600px' }}
            >
                      {codeContent && (
                        <MoleculeViewer
                          codeContent={codeContent}
                          containerRef={moleculeRef}
                          onViewerReady={handleViewerReady}
                          format={element.lang as 'sdf' | 'pdb' | 'smiles' | 'molecule'}
                        />
                      )}
                    </div>
          </div>
        )}
        
        {/* Diagramme Mermaid - mode split (côte à côte) */}
        {isMermaid && displayMode === 'split' && (
          <div className="flex-1 min-w-0 rounded-md border border-border bg-background p-4 flex flex-col">
            <div className="mb-2 flex items-center justify-between shrink-0">
              <div className="text-xs font-medium text-muted-foreground">
                Aperçu (molette: zoom, clic-glisser: déplacer)
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleResetView}
                title="Réinitialiser la vue"
              >
                <RotateCcwIcon className="size-3" />
              </Button>
            </div>
            <div
              ref={containerElementRef}
              className="flex items-center justify-center overflow-hidden min-h-[200px] flex-1 relative cursor-default select-none"
              onContextMenu={(e) => e.preventDefault()}
              contentEditable={false}
              style={{ touchAction: 'none', userSelect: 'none' }}
            >
              <div
                ref={mermaidContainerRef}
                style={{ 
                  willChange: 'transform',
                  imageRendering: 'crisp-edges',
                }}
              >
                <div
                  ref={mermaidRef}
                  className="flex items-center justify-center"
                  contentEditable={false}
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Molécule 3D - mode molecule only (en dessous) */}
      {isVega && vegaDisplayMode === 'graph' && (
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Graphique Vega
            </div>
            {!readOnly && (
              <VegaModeSelector
                currentMode={vegaDisplayMode}
                onModeChange={handleVegaModeChange}
              />
            )}
          </div>
          <div
            ref={vegaRef}
            className="w-full overflow-auto"
            style={{ minHeight: '300px' }}
          >
            {codeContent && (
              <VegaViewer
                codeContent={codeContent}
                containerRef={vegaRef}
                format={element.lang as 'vega' | 'vega-lite'}
                csvFiles={csvFiles}
              />
            )}
          </div>
        </div>
      )}

      {isMolecule && moleculeDisplayMode === 'molecule' && (
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Molécule 3D (rotation: clic-glisser, zoom: molette)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleMoleculeResetView}
                title="Réinitialiser la vue"
              >
                <RotateCcwIcon className="size-3" />
              </Button>
              {!readOnly && (
                <MoleculeModeSelector
                  currentMode={moleculeDisplayMode}
                  onModeChange={handleMoleculeModeChange}
                />
              )}
            </div>
          </div>
          <div
            ref={moleculeContainerElementRef}
            className="flex items-center justify-center overflow-hidden min-h-[300px] relative cursor-default select-none w-full"
            onContextMenu={(e) => e.preventDefault()}
            contentEditable={false}
            style={{ touchAction: 'none', userSelect: 'none', width: '100%', height: '100%' }}
          >
            {codeContent && (
              <MoleculeViewer
                codeContent={codeContent}
                containerRef={moleculeRef}
                onViewerReady={handleViewerReady}
                format={element.lang as 'mol' | 'sdf' | 'smiles' | 'molecule'}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Diagramme Mermaid - mode diagram only (en dessous) */}
      {isMermaid && displayMode === 'diagram' && (
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Diagramme Mermaid (molette: zoom, clic-glisser: déplacer)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleResetView}
                title="Réinitialiser la vue"
              >
                <RotateCcwIcon className="size-3" />
              </Button>
              {!readOnly && (
                <MermaidModeSelector
                  currentMode={displayMode}
                  onModeChange={handleModeChange}
                />
              )}
            </div>
          </div>
          <div
            ref={containerElementRef}
            className="flex items-center justify-center overflow-hidden min-h-[300px] relative cursor-default select-none"
            onContextMenu={(e) => e.preventDefault()}
            contentEditable={false}
            style={{ touchAction: 'none' }}
          >
            <div
              ref={mermaidContainerRef}
              style={{ 
                willChange: 'transform',
                imageRendering: 'crisp-edges',
              }}
            >
              <div
                ref={mermaidRef}
                className="flex items-center justify-center"
                contentEditable={false}
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Molécule 3D - mode code only (en dessous, optionnel) */}
      {isMolecule && moleculeDisplayMode === 'code' && (
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Aperçu 3D (rotation: clic-glisser, zoom: molette)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleMoleculeResetView}
                title="Réinitialiser la vue"
              >
                <RotateCcwIcon className="size-3" />
              </Button>
              {!readOnly && (
                <MoleculeModeSelector
                  currentMode={moleculeDisplayMode}
                  onModeChange={handleMoleculeModeChange}
                />
              )}
            </div>
          </div>
          <div
            ref={moleculeContainerElementRef}
            className="flex items-center justify-center overflow-hidden min-h-[300px] relative cursor-default select-none w-full"
            onContextMenu={(e) => e.preventDefault()}
            contentEditable={false}
            style={{ touchAction: 'none', userSelect: 'none', width: '100%', height: '100%' }}
          >
            {codeContent && (
              <MoleculeViewer
                codeContent={codeContent}
                containerRef={moleculeRef}
                onViewerReady={handleViewerReady}
                format={element.lang as 'mol' | 'sdf' | 'smiles' | 'molecule'}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Diagramme Mermaid - mode code only (en dessous, optionnel) */}
      {isVega && vegaDisplayMode === 'code' && (
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Code Vega uniquement
            </div>
            {!readOnly && (
              <VegaModeSelector
                currentMode={vegaDisplayMode}
                onModeChange={handleVegaModeChange}
              />
            )}
          </div>
        </div>
      )}

      {isMermaid && displayMode === 'code' && (
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Aperçu du diagramme (molette: zoom, clic-glisser: déplacer)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleResetView}
                title="Réinitialiser la vue"
              >
                <RotateCcwIcon className="size-3" />
              </Button>
              {!readOnly && (
                <MermaidModeSelector
                  currentMode={displayMode}
                  onModeChange={handleModeChange}
                />
              )}
            </div>
          </div>
          <div
            ref={containerElementRef}
            className="flex items-center justify-center overflow-hidden min-h-[300px] relative cursor-default select-none"
            onContextMenu={(e) => e.preventDefault()}
            contentEditable={false}
            style={{ touchAction: 'none' }}
          >
            <div
              ref={mermaidContainerRef}
              style={{ 
                willChange: 'transform',
                imageRendering: 'crisp-edges',
              }}
            >
              <div
                ref={mermaidRef}
                className="flex items-center justify-center"
                contentEditable={false}
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </div>
        </div>
      )}
    </PlateElement>
  );
}

function MermaidModeSelector({
  currentMode,
  onModeChange,
}: {
  currentMode: MermaidDisplayMode;
  onModeChange: (mode: MermaidDisplayMode) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const modes: { label: string; value: MermaidDisplayMode; icon: React.ReactNode }[] = [
    { label: 'Split (Code + Diagramme)', value: 'split', icon: <SplitIcon className="size-3" /> },
    { label: 'Diagramme uniquement', value: 'diagram', icon: <EyeIcon className="size-3" /> },
    { label: 'Code uniquement', value: 'code', icon: <CodeIcon className="size-3" /> },
  ];

  const currentModeLabel = modes.find((m) => m.value === currentMode)?.label || 'Split';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 justify-between gap-1 px-2 text-xs text-muted-foreground select-none"
          aria-expanded={open}
          role="combobox"
          title="Mode d'affichage Mermaid"
        >
          {modes.find((m) => m.value === currentMode)?.icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {modes.map((mode) => (
                <CommandItem
                  key={mode.value}
                  className="cursor-pointer"
                  value={mode.value}
                  onSelect={() => {
                    onModeChange(mode.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {mode.icon}
                    {mode.label}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      currentMode === mode.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function MoleculeModeSelector({
  currentMode,
  onModeChange,
}: {
  currentMode: MoleculeDisplayMode;
  onModeChange: (mode: MoleculeDisplayMode) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const modes: { label: string; value: MoleculeDisplayMode; icon: React.ReactNode }[] = [
    { label: 'Split (Code + Molécule)', value: 'split', icon: <SplitIcon className="size-3" /> },
    { label: 'Molécule uniquement', value: 'molecule', icon: <EyeIcon className="size-3" /> },
    { label: 'Code uniquement', value: 'code', icon: <CodeIcon className="size-3" /> },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 justify-between gap-1 px-2 text-xs text-muted-foreground select-none"
          aria-expanded={open}
          role="combobox"
          title="Mode d'affichage Molécule"
        >
          {modes.find((m) => m.value === currentMode)?.icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {modes.map((mode) => (
                <CommandItem
                  key={mode.value}
                  className="cursor-pointer"
                  value={mode.value}
                  onSelect={() => {
                    onModeChange(mode.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {mode.icon}
                    {mode.label}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      currentMode === mode.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function VegaModeSelector({
  currentMode,
  onModeChange,
}: {
  currentMode: VegaDisplayMode;
  onModeChange: (mode: VegaDisplayMode) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const modes: { label: string; value: VegaDisplayMode; icon: React.ReactNode }[] = [
    { label: 'Split (Code + Graphique)', value: 'split', icon: <SplitIcon className="size-3" /> },
    { label: 'Graphique uniquement', value: 'graph', icon: <EyeIcon className="size-3" /> },
    { label: 'Code uniquement', value: 'code', icon: <CodeIcon className="size-3" /> },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 justify-between gap-1 px-2 text-xs text-muted-foreground select-none"
          aria-expanded={open}
          role="combobox"
          title="Mode d'affichage Vega"
        >
          {modes.find((m) => m.value === currentMode)?.icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {modes.map((mode) => (
                <CommandItem
                  key={mode.value}
                  className="cursor-pointer"
                  value={mode.value}
                  onSelect={() => {
                    onModeChange(mode.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {mode.icon}
                    {mode.label}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      currentMode === mode.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CodeBlockCombobox() {
  const [open, setOpen] = React.useState(false);
  const readOnly = useReadOnly();
  const editor = useEditorRef();
  const element = useElement<TCodeBlockElement>();
  const value = element.lang || 'plaintext';
  const [searchValue, setSearchValue] = React.useState('');

  const items = React.useMemo(
    () =>
      languages.filter(
        (language) =>
          !searchValue ||
          language.label.toLowerCase().includes(searchValue.toLowerCase())
      ),
    [searchValue]
  );

  if (readOnly) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 justify-between gap-1 px-2 text-xs text-muted-foreground select-none"
          aria-expanded={open}
          role="combobox"
        >
          {languages.find((language) => language.value === value)?.label ??
            'Plain Text'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0"
        onCloseAutoFocus={() => setSearchValue('')}
      >
        <Command shouldFilter={false}>
          <CommandInput
            className="h-9"
            value={searchValue}
            onValueChange={(value) => setSearchValue(value)}
            placeholder="Search language..."
          />
          <CommandEmpty>No language found.</CommandEmpty>

          <CommandList className="h-[344px] overflow-y-auto">
            <CommandGroup>
              {items.map((language) => (
                <CommandItem
                  key={language.label}
                  className="cursor-pointer"
                  value={language.value}
                  onSelect={(value) => {
                    editor.tf.setNodes<TCodeBlockElement>(
                      { lang: value },
                      { at: element }
                    );
                    setSearchValue(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      value === language.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {language.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CopyButton({
  value,
  ...props
}: { value: (() => string) | string } & Omit<
  React.ComponentProps<typeof Button>,
  'value'
>) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(
          typeof value === 'function' ? value() : value
        );
        setHasCopied(true);
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? (
        <CheckIcon className="!size-3" />
      ) : (
        <CopyIcon className="!size-3" />
      )}
    </Button>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} />;
}

export function CodeSyntaxLeaf(props: PlateLeafProps<TCodeSyntaxLeaf>) {
  const tokenClassName = props.leaf.className as string;

  return <PlateLeaf className={tokenClassName} {...props} />;
}

const languages: { label: string; value: string }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'ABAP', value: 'abap' },
  { label: 'Agda', value: 'agda' },
  { label: 'Arduino', value: 'arduino' },
  { label: 'ASCII Art', value: 'ascii' },
  { label: 'Assembly', value: 'x86asm' },
  { label: 'Bash', value: 'bash' },
  { label: 'BASIC', value: 'basic' },
  { label: 'BNF', value: 'bnf' },
  { label: 'C', value: 'c' },
  { label: 'C#', value: 'csharp' },
  { label: 'C++', value: 'cpp' },
  { label: 'Clojure', value: 'clojure' },
  { label: 'CoffeeScript', value: 'coffeescript' },
  { label: 'Coq', value: 'coq' },
  { label: 'CSS', value: 'css' },
  { label: 'Dart', value: 'dart' },
  { label: 'Dhall', value: 'dhall' },
  { label: 'Diff', value: 'diff' },
  { label: 'Docker', value: 'dockerfile' },
  { label: 'EBNF', value: 'ebnf' },
  { label: 'Elixir', value: 'elixir' },
  { label: 'Elm', value: 'elm' },
  { label: 'Erlang', value: 'erlang' },
  { label: 'F#', value: 'fsharp' },
  { label: 'Flow', value: 'flow' },
  { label: 'Fortran', value: 'fortran' },
  { label: 'Gherkin', value: 'gherkin' },
  { label: 'GLSL', value: 'glsl' },
  { label: 'Go', value: 'go' },
  { label: 'GraphQL', value: 'graphql' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'Haskell', value: 'haskell' },
  { label: 'HCL', value: 'hcl' },
  { label: 'HTML', value: 'html' },
  { label: 'Idris', value: 'idris' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'Julia', value: 'julia' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'LaTeX', value: 'latex' },
  { label: 'Less', value: 'less' },
  { label: 'Lisp', value: 'lisp' },
  { label: 'LiveScript', value: 'livescript' },
  { label: 'LLVM IR', value: 'llvm' },
  { label: 'Lua', value: 'lua' },
  { label: 'Makefile', value: 'makefile' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Markup', value: 'markup' },
  { label: 'MATLAB', value: 'matlab' },
  { label: 'Mathematica', value: 'mathematica' },
  { label: 'Mermaid', value: 'mermaid' },
  // Formats supportés par 3Dmol.js (uniquement SDF et PDB)
  { label: 'PDB', value: 'pdb' },
  { label: 'SDF', value: 'sdf' },
  { label: 'Molecule (SMILES)', value: 'molecule' },
  { label: 'SMILES', value: 'smiles' },
  { label: 'Nix', value: 'nix' },
  { label: 'Notion Formula', value: 'notion' },
  { label: 'Objective-C', value: 'objectivec' },
  { label: 'OCaml', value: 'ocaml' },
  { label: 'Pascal', value: 'pascal' },
  { label: 'Perl', value: 'perl' },
  { label: 'PHP', value: 'php' },
  { label: 'PowerShell', value: 'powershell' },
  { label: 'Prolog', value: 'prolog' },
  { label: 'Protocol Buffers', value: 'protobuf' },
  { label: 'PureScript', value: 'purescript' },
  { label: 'Python', value: 'python' },
  { label: 'R', value: 'r' },
  { label: 'Racket', value: 'racket' },
  { label: 'Reason', value: 'reasonml' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Rust', value: 'rust' },
  { label: 'Sass', value: 'scss' },
  { label: 'Scala', value: 'scala' },
  { label: 'Scheme', value: 'scheme' },
  { label: 'SCSS', value: 'scss' },
  { label: 'Shell', value: 'shell' },
  { label: 'Smalltalk', value: 'smalltalk' },
  { label: 'Solidity', value: 'solidity' },
  { label: 'SQL', value: 'sql' },
  { label: 'Swift', value: 'swift' },
  { label: 'TOML', value: 'toml' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'VB.Net', value: 'vbnet' },
  { label: 'Vega', value: 'vega' },
  { label: 'Vega-Lite', value: 'vega-lite' },
  { label: 'Verilog', value: 'verilog' },
  { label: 'VHDL', value: 'vhdl' },
  { label: 'Visual Basic', value: 'vbnet' },
  { label: 'WebAssembly', value: 'wasm' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' },
];
