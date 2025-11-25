'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

// Composant interne qui utilise Vega-Embed
function VegaViewerInternal({ 
  codeContent, 
  containerRef,
  onViewerReady,
  format,
  csvFiles = [],
}: { 
  codeContent: string;
  containerRef: React.RefObject<HTMLDivElement>;
  onViewerReady?: (viewer: any) => void;
  format?: 'vega' | 'vega-lite';
  csvFiles?: Array<{ id: string; name: string; data: any[] }>;
}) {
  const viewerRef = React.useRef<any>(null);
  const innerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const isRenderingRef = React.useRef(false);
  const { theme, resolvedTheme } = useTheme();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Déterminer le thème actuel (dark ou light)
  const currentTheme = resolvedTheme || theme || 'light';
  const isDark = currentTheme === 'dark';

  // Attendre que le conteneur soit monté avant de lancer le chargement
  React.useEffect(() => {
    console.log('[VegaViewer] useEffect triggered, containerRef.current:', !!containerRef.current);
    
    // Si le conteneur n'est pas encore disponible, attendre un peu
    if (!containerRef.current) {
      console.log('[VegaViewer] No container yet, will retry...');
      const checkInterval = setInterval(() => {
        if (containerRef.current) {
          clearInterval(checkInterval);
          console.log('[VegaViewer] Container now available, starting load');
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }

    let viewer: any = null;
    let isMounted = true;

    const loadVega = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      let isCompleted = false;
      
      try {
        console.log('[VegaViewer] Starting loadVega');
        setIsLoading(true);
        setError(null);

        // Timeout pour éviter les chargements infinis
        timeoutId = setTimeout(() => {
          if (!isCompleted) {
            console.error('[VegaViewer] TIMEOUT: Le chargement prend trop de temps');
            setError('Le chargement du graphique prend trop de temps. Vérifiez que le format JSON est correct.');
            setIsLoading(false);
          }
        }, 5000); // 5 secondes de timeout

        // Charger Vega-Embed dynamiquement
        console.log('[VegaViewer] Importing vega-embed...');
        const vegaEmbed = await import('vega-embed');
        console.log('[VegaViewer] vega-embed imported:', !!vegaEmbed);

        const container = containerRef.current;
        if (!container) {
          console.error('[VegaViewer] Container not available');
          if (timeoutId) clearTimeout(timeoutId);
          isCompleted = true;
          setIsLoading(false);
          setError('Le conteneur n\'est pas disponible');
          return;
        }
        console.log('[VegaViewer] Container found');

        // Créer un conteneur interne pour vega-embed
        // Cela évite les conflits avec React qui gère le conteneur parent
        if (!innerContainerRef.current) {
          const innerContainer = document.createElement('div');
          innerContainer.style.width = '100%';
          innerContainer.style.height = '100%';
          innerContainer.style.minHeight = '200px';
          innerContainer.style.display = 'flex';
          innerContainer.style.alignItems = 'center';
          innerContainer.style.justifyContent = 'center';
          container.appendChild(innerContainer);
          innerContainerRef.current = innerContainer;
        }
        
        const innerContainer = innerContainerRef.current;

        // Parser le contenu JSON
        let spec: any;
        try {
          spec = JSON.parse(codeContent);
          console.log('[VegaViewer] JSON parsed successfully');
        } catch (parseError) {
          console.error('[VegaViewer] Error parsing JSON:', parseError);
          if (timeoutId) clearTimeout(timeoutId);
          isCompleted = true;
          setIsLoading(false);
          setError('Erreur de parsing JSON. Vérifiez que le format est valide.');
          return;
        }
        
        // Injecter les données CSV dans la spécification si nécessaire
        if (csvFiles.length > 0) {
          // Fonction récursive pour remplacer les références CSV dans toute la spec
          const replaceCsvReferences = (obj: any): any => {
            if (Array.isArray(obj)) {
              return obj.map(item => replaceCsvReferences(item));
            } else if (obj && typeof obj === 'object') {
              const result: any = {};
              for (const [key, value] of Object.entries(obj)) {
                // Si on trouve une référence data.url qui correspond à un fichier CSV uploadé
                if (key === 'data' && value && typeof value === 'object' && 'url' in value) {
                  const urlValue = (value as any).url;
                  // Vérifier si l'URL correspond à un nom de fichier CSV uploadé
                  const matchingCsv = csvFiles.find(f => 
                    f.name === urlValue || 
                    urlValue.endsWith(f.name) ||
                    urlValue.includes(f.name)
                  );
                  
                  if (matchingCsv) {
                    // Remplacer par les données réelles
                    result[key] = {
                      values: matchingCsv.data,
                      // Conserver le format si spécifié
                      ...(value as any).format ? { format: (value as any).format } : {}
                    };
                    console.log(`[VegaViewer] Replaced CSV reference "${urlValue}" with data from "${matchingCsv.name}"`);
                  } else {
                    // Pas de correspondance, garder l'original mais continuer la recherche récursive
                    result[key] = replaceCsvReferences(value);
                  }
                } else if (key === 'data' && value && typeof value === 'object' && 'name' in value) {
                  // Gérer les références par nom
                  const nameValue = (value as any).name;
                  const matchingCsv = csvFiles.find(f => f.name === nameValue);
                  
                  if (matchingCsv) {
                    result[key] = {
                      name: nameValue,
                      values: matchingCsv.data,
                      ...(value as any).format ? { format: (value as any).format } : {}
                    };
                    console.log(`[VegaViewer] Replaced CSV reference by name "${nameValue}" with data from "${matchingCsv.name}"`);
                  } else {
                    result[key] = replaceCsvReferences(value);
                  }
                } else {
                  // Continuer la recherche récursive
                  result[key] = replaceCsvReferences(value);
                }
              }
              return result;
            }
            return obj;
          };
          
          // Appliquer le remplacement récursif
          spec = replaceCsvReferences(spec);
          
          // Si aucune donnée n'a été trouvée et qu'il n'y a qu'un seul CSV, l'utiliser par défaut
          if (!spec.data && csvFiles.length === 1) {
            spec.data = { values: csvFiles[0].data };
            console.log(`[VegaViewer] Using default CSV "${csvFiles[0].name}" as data source`);
          }
          
          // Gérer les datasets multiples (pour les graphiques avec plusieurs sources)
          if (csvFiles.length > 1) {
            // Créer un objet datasets pour référencer plusieurs CSV
            const datasets: any = {};
            csvFiles.forEach(file => {
              datasets[file.name] = { values: file.data };
            });
            
            // Si la spec utilise des datasets, les remplacer
            if (spec.datasets) {
              spec.datasets = { ...spec.datasets, ...datasets };
            } else {
              spec.datasets = datasets;
            }
          }
        }

        // Déterminer le format (vega ou vega-lite)
        const isVegaLite = format === 'vega-lite' || !format || spec.$schema?.includes('vega-lite');
        console.log('[VegaViewer] Format:', isVegaLite ? 'vega-lite' : 'vega');

        // Rendre le graphique avec vega-embed
        // vega-embed va gérer le nettoyage du conteneur automatiquement
        console.log('[VegaViewer] Rendering chart...');
        
        // Ne pas nettoyer manuellement - vega-embed gère le nettoyage automatiquement
        // Si on nettoie manuellement, cela peut causer des conflits avec React
        
        // Adapter le thème du graphique au thème de l'application
        // Utiliser les couleurs CSS de l'application pour rester cohérent
        const themeConfig = isDark ? {
          background: 'transparent',
          title: { 
            color: '#E6EDF3', // foreground dark
            font: 'var(--font-sans)',
          },
          style: {
            'guide-label': { fill: '#9FB0C3' }, // muted-foreground dark
            'guide-title': { fill: '#E6EDF3' }, // foreground dark
            'group-title': { fill: '#E6EDF3' }, // foreground dark
            'group-subtitle': { fill: '#9FB0C3' }, // muted-foreground dark
          },
          axis: {
            domainColor: 'rgba(255, 255, 255, 0.08)', // border dark
            gridColor: 'rgba(255, 255, 255, 0.08)', // border dark
            tickColor: 'rgba(255, 255, 255, 0.08)', // border dark
            labelColor: '#9FB0C3', // muted-foreground dark
            titleColor: '#E6EDF3', // foreground dark
            labelFont: 'var(--font-sans)',
            titleFont: 'var(--font-sans)',
          },
          legend: {
            labelColor: '#9FB0C3', // muted-foreground dark
            titleColor: '#E6EDF3', // foreground dark
            labelFont: 'var(--font-sans)',
            titleFont: 'var(--font-sans)',
          },
          view: {
            stroke: 'rgba(255, 255, 255, 0.08)', // border dark
          },
        } : {
          background: 'transparent',
          title: { 
            color: '#0B1320', // foreground light
            font: 'var(--font-sans)',
          },
          style: {
            'guide-label': { fill: '#627184' }, // muted-foreground light
            'guide-title': { fill: '#0B1320' }, // foreground light
            'group-title': { fill: '#0B1320' }, // foreground light
            'group-subtitle': { fill: '#627184' }, // muted-foreground light
          },
          axis: {
            domainColor: '#E4E9EE', // border light
            gridColor: '#E4E9EE', // border light
            tickColor: '#E4E9EE', // border light
            labelColor: '#627184', // muted-foreground light
            titleColor: '#0B1320', // foreground light
            labelFont: 'var(--font-sans)',
            titleFont: 'var(--font-sans)',
          },
          legend: {
            labelColor: '#627184', // muted-foreground light
            titleColor: '#0B1320', // foreground light
            labelFont: 'var(--font-sans)',
            titleFont: 'var(--font-sans)',
          },
          view: {
            stroke: '#E4E9EE', // border light
          },
        };
        
        // Obtenir les dimensions du conteneur parent
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width || 400;
        const containerHeight = containerRect.height || 300;
        
        console.log('[VegaViewer] Container dimensions:', containerWidth, containerHeight);
        
        // Adapter automatiquement la taille du graphique au conteneur
        // Si width ou height sont spécifiés, les remplacer par les dimensions du conteneur
        const specWithTheme = {
          ...spec,
          // Forcer la largeur et la hauteur à s'adapter au conteneur
          width: containerWidth - 40, // Soustraire un peu pour le padding
          height: containerHeight - 40, // Soustraire un peu pour le padding
          autosize: {
            type: 'fit',
            contains: 'padding',
          },
          config: {
            ...spec.config,
            ...themeConfig,
          },
        };
        
        // Utiliser le conteneur interne pour éviter les conflits avec React
        const result = await vegaEmbed.default(innerContainer, specWithTheme, {
          mode: isVegaLite ? 'vega-lite' : 'vega',
          renderer: 'svg',
          theme: isDark ? 'dark' : 'default',
          actions: {
            export: true,
            source: false,
            compiled: false,
            editor: false,
          },
        });
        
        console.log('[VegaViewer] Chart rendered successfully');
        viewer = result.view;
        viewerRef.current = viewer;
        
        // S'assurer que le viewer se redimensionne si le conteneur change
        // Faire cela APRÈS avoir assigné viewerRef.current pour éviter l'erreur
        if (viewerRef.current && result.view && result.view.resize) {
          // Écouter les changements de taille du conteneur
          const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const { width, height } = entry.contentRect;
              if (viewerRef.current && viewerRef.current.resize) {
                viewerRef.current.resize(width, height);
                viewerRef.current.run();
              }
            }
          });
          
          resizeObserver.observe(container);
          
          // Stocker l'observer pour le nettoyer plus tard
          (viewerRef.current as any).resizeObserver = resizeObserver;
        }

        if (onViewerReady) {
          onViewerReady(viewer);
        }

        isCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);
        setIsLoading(false);
        isRenderingRef.current = false;
      } catch (err: any) {
        console.error('[VegaViewer] Error loading Vega:', err);
        isCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);
        setIsLoading(false);
        setError(err.message || 'Erreur lors du chargement du graphique Vega. Vérifiez la spécification JSON.');
        isRenderingRef.current = false;
      }
    };

    loadVega();

    // Cleanup
    return () => {
      console.log('[VegaViewer] Cleanup function called');
      isMounted = false;
      isRenderingRef.current = false;
      if (viewerRef.current) {
        try {
          // Nettoyer l'observer de redimensionnement s'il existe
          if ((viewerRef.current as any).resizeObserver) {
            (viewerRef.current as any).resizeObserver.disconnect();
          }
          
          // Nettoyer le viewer Vega de manière sûre
          if (viewerRef.current.finalize) {
            viewerRef.current.finalize();
          }
        } catch (error) {
          console.warn('[VegaViewer] Error disposing Vega viewer:', error);
        }
        viewerRef.current = null;
      }
      
      // Nettoyer le conteneur interne de manière sûre
      if (innerContainerRef.current && containerRef.current) {
        try {
          const innerContainer = innerContainerRef.current;
          const parentContainer = containerRef.current;
          
          // Vérifier que le conteneur interne est toujours un enfant du parent
          // et que le parent contient toujours l'enfant avant de le supprimer
          if (parentContainer.contains(innerContainer) && innerContainer.parentNode === parentContainer) {
            parentContainer.removeChild(innerContainer);
          }
        } catch (cleanError) {
          console.warn('[VegaViewer] Error cleaning inner container (this is usually safe to ignore):', cleanError);
          // Si le nettoyage échoue, c'est probablement parce que React ou vega-embed l'a déjà fait
          // Ce n'est pas grave, on continue
        }
        innerContainerRef.current = null;
      }
    };
  }, [codeContent, containerRef, onViewerReady, format, isDark, currentTheme]);

  if (error) {
    return (
      <div className="text-destructive p-4 text-sm">
        {error}
      </div>
    );
  }

  // Toujours rendre le conteneur, même pendant le chargement
  // Cela permet à containerRef.current d'être disponible
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '200px',
        position: 'relative',
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Chargement du graphique...
        </div>
      )}
    </div>
  );
}

// Charger dynamiquement avec ssr: false pour éviter les problèmes avec Turbopack
export const VegaViewer = dynamic(() => Promise.resolve(VegaViewerInternal), {
  ssr: false,
});

