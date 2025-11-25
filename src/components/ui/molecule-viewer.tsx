'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

// Composant interne qui utilise 3Dmol.js
function MoleculeViewerInternal({ 
  codeContent, 
  containerRef,
  onViewerReady,
  format,
}: { 
  codeContent: string;
  containerRef: React.RefObject<HTMLDivElement>;
  onViewerReady?: (viewer: any) => void;
  format?: 'sdf' | 'smiles' | 'molecule' | 'pdb';
}) {
  const viewerRef = React.useRef<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hoveredAtom, setHoveredAtom] = React.useState<{
    atom: any;
    x: number;
    y: number;
  } | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Attendre que le conteneur soit monté avant de lancer le chargement
  React.useEffect(() => {
    console.log('[MoleculeViewer] useEffect triggered, containerRef.current:', !!containerRef.current);
    
    // Si le conteneur n'est pas encore disponible, attendre un peu
    if (!containerRef.current) {
      console.log('[MoleculeViewer] No container yet, will retry...');
      const checkInterval = setInterval(() => {
        if (containerRef.current) {
          clearInterval(checkInterval);
          console.log('[MoleculeViewer] Container now available, starting load');
          // Le useEffect se déclenchera à nouveau quand containerRef.current change
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }

    let viewer: any = null;
    let resizeHandler: (() => void) | null = null;
    let isMounted = true;

    const load3Dmol = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      let isCompleted = false;
      
      try {
        console.log('[MoleculeViewer] Starting load3Dmol');
        setIsLoading(true);
        setError(null);

        // Timeout pour éviter les chargements infinis
        timeoutId = setTimeout(() => {
          if (!isCompleted) {
            console.error('[MoleculeViewer] TIMEOUT: Le chargement prend trop de temps');
            setError('Le chargement de la molécule prend trop de temps. Vérifiez que le format est correct.');
            setIsLoading(false);
          }
        }, 3000); // 3 secondes de timeout

        // Charger 3Dmol.js dynamiquement
        console.log('[MoleculeViewer] Importing 3Dmol.js...');
        const $3Dmol = await import('3dmol/build/3Dmol.js');
        console.log('[MoleculeViewer] 3Dmol.js imported:', !!$3Dmol);

        const container = containerRef.current;
        if (!container) {
          console.error('[MoleculeViewer] Container not available');
          if (timeoutId) clearTimeout(timeoutId);
          isCompleted = true;
          setIsLoading(false);
          setError('Le conteneur n\'est pas disponible');
          return;
        }
        console.log('[MoleculeViewer] Container found');

        // Attendre que le conteneur ait des dimensions
        console.log('[MoleculeViewer] Waiting for container dimensions...');
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Ne pas nettoyer le conteneur manuellement
        // 3Dmol.js va gérer le nettoyage et la création de son propre contenu
        // Si un viewer existe déjà, on le nettoie d'abord
        if (viewerRef.current && viewerRef.current.clear) {
          try {
            viewerRef.current.clear();
            console.log('[MoleculeViewer] Previous viewer cleared');
          } catch (clearError) {
            console.warn('[MoleculeViewer] Error clearing previous viewer:', clearError);
          }
        }
        
        // Le conteneur doit prendre toute la place disponible
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.display = 'block';
        container.style.minHeight = '200px';
        
        // Obtenir les dimensions réelles du parent
        const parentRect = container.getBoundingClientRect();
        let width = parentRect.width;
        let height = parentRect.height;
        console.log('[MoleculeViewer] Initial dimensions:', width, height);
        
        // Si pas de dimensions ou dimensions anormales, utiliser des valeurs par défaut
        if (!width || width === 0 || !height || height === 0 || height > 10000) {
          console.log('[MoleculeViewer] Invalid dimensions, using defaults or waiting...');
          if (height > 10000) {
            // Hauteur anormale, utiliser une valeur raisonnable
            height = 400;
            width = width || 400;
            container.style.height = `${height}px`;
            container.style.width = `${width}px`;
            console.log('[MoleculeViewer] Fixed abnormal dimensions to:', width, height);
          } else {
            await new Promise(resolve => setTimeout(resolve, 100));
            const newRect = container.getBoundingClientRect();
            width = newRect.width || 400;
            height = newRect.height || 300;
            console.log('[MoleculeViewer] New dimensions:', width, height);
          }
        }
        
        // S'assurer que les dimensions sont raisonnables
        if (width > 0 && height > 0 && height < 10000) {
          container.style.width = `${width}px`;
          container.style.height = `${height}px`;
        }

        // Créer le viewer 3Dmol - selon la doc, on peut passer l'élément directement
        // 3Dmol.js va gérer le nettoyage du conteneur lui-même
        console.log('[MoleculeViewer] Creating viewer...');
        
        // S'assurer qu'on utilise le bon conteneur (au cas où il aurait été remplacé)
        const actualContainer = containerRef.current || container;
        
        viewer = $3Dmol.createViewer(actualContainer, {
          defaultcolors: $3Dmol.elementColors.rasmol,
          backgroundColor: 'white', // Utiliser 'white' au lieu de 0xf5f5f5 pour éviter le noir
        });
        
        // S'assurer que le background est bien blanc
        viewer.setBackgroundColor('white');

        viewerRef.current = viewer;
        
        console.log('[MoleculeViewer] Viewer created:', !!viewer);
        console.log('[MoleculeViewer] Container dimensions:', width, height);
        
        // S'assurer que le viewer a les bonnes dimensions AVANT d'ajouter le modèle
        // Selon la doc, il faut que le conteneur ait des dimensions définies
        if (width > 0 && height > 0) {
          console.log('[MoleculeViewer] Resizing viewer...');
          viewer.resize();
        } else {
          // Attendre que les dimensions soient disponibles
          console.log('[MoleculeViewer] Waiting for dimensions before resize...');
          await new Promise(resolve => setTimeout(resolve, 200));
          const finalRect = container.getBoundingClientRect();
          if (finalRect.width > 0 && finalRect.height > 0) {
            viewer.resize();
          }
        }

        const content = codeContent.trim();
        console.log('Content:', content.substring(0, 100));
        console.log('Format:', format);

        if (!content) {
          throw new Error('Le contenu est vide');
        }

        // Déterminer le format automatiquement si non spécifié
        let detectedFormat = format;
        if (!detectedFormat) {
          // Détection automatique basée sur le contenu (uniquement SDF et PDB)
          if (content.includes('$$$$') || content.includes('V2000') || content.includes('V3000') || content.includes('M  END')) {
            detectedFormat = 'sdf';
          } else if (content.includes('ATOM') || content.includes('HETATM') || content.includes('HEADER')) {
            detectedFormat = 'pdb';
          } else {
            detectedFormat = 'smiles'; // Par défaut, on suppose SMILES
          }
        }

        console.log('Detected format:', detectedFormat);
        console.log('Content preview:', content.substring(0, 200));

        // Charger la molécule
        let modelAdded = false;
        
        // Formats supportés directement par 3Dmol.js (uniquement SDF et PDB)
        const supportedFormats = ['pdb', 'sdf'];
        
        if (supportedFormats.includes(detectedFormat)) {
          try {
            console.log('Adding model directly with format:', detectedFormat, 'Content length:', content.length);
            
            // Nettoyer le contenu si nécessaire (enlever les espaces en début/fin)
            const cleanContent = content.trim();
            
            // Vérifier que le contenu contient bien les marqueurs MOL
            if (detectedFormat === 'mol' && !cleanContent.includes('V2000') && !cleanContent.includes('V3000') && !cleanContent.includes('M  END')) {
              throw new Error('Le format MOL semble invalide. Vérifiez que le fichier contient "V2000" ou "V3000" et "M  END".');
            }
            
            // Utiliser directement le format détecté (SDF ou PDB)
            let contentToUse = cleanContent;
            let formatToUse = detectedFormat;
            
            // Si le contenu ressemble à MOL (V2000/V3000) mais n'a pas $$$$, l'ajouter pour SDF
            if (detectedFormat === 'sdf' && (cleanContent.includes('V2000') || cleanContent.includes('V3000')) && !cleanContent.includes('$$$$')) {
              contentToUse = cleanContent + '\n$$$$';
              console.log('Added $$$$ marker for SDF format');
            }
            
            // Pour PDB, s'assurer qu'il y a au moins quelques atomes
            if (detectedFormat === 'pdb') {
              const atomCount = (contentToUse.match(/^ATOM\s+/gm) || []).length;
              const hetatmCount = (contentToUse.match(/^HETATM\s+/gm) || []).length;
              const totalAtoms = atomCount + hetatmCount;
              console.log('PDB file - ATOM count:', atomCount, 'HETATM count:', hetatmCount, 'Total:', totalAtoms);
              
              if (totalAtoms === 0) {
                throw new Error('Le fichier PDB ne contient aucun atome. Vérifiez que le fichier est complet et contient des lignes ATOM ou HETATM.');
              }
              
              // Stocker ces infos pour le style plus tard
              (viewer as any).__atomCount = atomCount;
              (viewer as any).__hetatmCount = hetatmCount;
              
              if (totalAtoms < 10) {
                console.warn('PDB file has very few atoms (' + totalAtoms + '), this might be incomplete');
              }
            }
            
            // Selon la doc, addModel retourne le modèle ajouté
            const addedModel = viewer.addModel(contentToUse, formatToUse);
            console.log('Model added from', formatToUse, 'format (original:', detectedFormat, '), model:', addedModel);
            
            // Vérifier que le modèle a été ajouté
            // Selon la doc, getModel() peut retourner un modèle ou un tableau
            const models = viewer.getModel();
            console.log('Models after addModel:', models);
            
            if (!models) {
              console.warn('Model was added but getModel() returned null/undefined');
              modelAdded = false;
              throw new Error('Le modèle n\'a pas pu être chargé. Vérifiez que le format MOL/SDF est correct.');
            } else {
              // Vérifier les atomes - selon la doc, models peut être un GLModel ou un tableau
              const modelArray = Array.isArray(models) ? models : [models];
              const totalAtoms = modelArray.reduce((sum, m) => sum + (m.atoms?.length || 0), 0);
              console.log('Model verified, total atoms count:', totalAtoms);
              if (totalAtoms === 0) {
                console.error('Model has no atoms - parsing failed!');
                throw new Error('Le modèle a été ajouté mais ne contient aucun atome. Vérifiez que le format MOL est correct et complet.');
              }
              modelAdded = true;
            }
          } catch (molError) {
            console.error('Error adding', detectedFormat, 'model:', molError);
            // Essayer avec l'autre format seulement si l'erreur n'est pas critique
            if (molError instanceof Error && !molError.message.includes('invalide')) {
              try {
                const altFormat = detectedFormat === 'mol' ? 'sdf' : 'mol';
                console.log('Trying alternative format:', altFormat);
                viewer.addModel(content.trim(), altFormat);
                modelAdded = true;
                console.log('Model added with alternative format:', altFormat);
              } catch (altError) {
                console.error('Error with alternative format:', altError);
                throw new Error(`Impossible de charger le fichier ${detectedFormat.toUpperCase()}. Erreur: ${altError instanceof Error ? altError.message : 'Erreur inconnue'}`);
              }
            } else {
              throw molError;
            }
          }
        } else {
          // Si c'est SMILES, convertir via API
          console.log('Converting SMILES to MOL/SDF via API');
          let molData: string | null = null;
          const apiUrls = [
            `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(content)}/mol`,
            `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(content)}/sdf`,
          ];

          for (const url of apiUrls) {
            try {
              const molResponse = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'text/plain' },
              });

              if (molResponse.ok) {
                molData = await molResponse.text();
                if (molData && molData.trim().length > 50 && 
                    (molData.includes('V2000') || molData.includes('V3000') || 
                     molData.includes('M  END') || molData.includes('$$$$'))) {
                  console.log('MOL/SDF data loaded from API, length:', molData.length);
                  break;
                }
                molData = null;
              }
            } catch (apiError) {
              continue;
            }
          }

          if (molData) {
            const apiFormat = molData.includes('$$$$') ? 'sdf' : 'mol';
            try {
              viewer.addModel(molData, apiFormat);
              modelAdded = true;
              console.log('Model added from API conversion');
            } catch (apiError) {
              console.error('Error adding converted model:', apiError);
            }
          }

          if (!modelAdded) {
            throw new Error(
              'Impossible de convertir SMILES en format MOL/SDF. ' +
              'Utilisez directement le format MOL ou SDF, ou vérifiez que le code SMILES est valide.'
            );
          }
        }

        // Vérifier que le modèle a été ajouté
        const models = viewer.getModel();
        console.log('Models after adding:', models);
        
        if (!models) {
          throw new Error('Le modèle n\'a pas été ajouté correctement. Vérifiez que le format est valide.');
        }
        
        // Vérifier qu'il y a des atomes
        const modelArray = Array.isArray(models) ? models : [models];
        const totalAtoms = modelArray.reduce((sum, m) => sum + (m.atoms?.length || 0), 0);
        
        if (totalAtoms === 0) {
          throw new Error('Le modèle ne contient aucun atome. Vérifiez que le fichier est complet et valide.');
        }
        
        console.log('Total atoms in model:', totalAtoms);

        // Appliquer tous les styles disponibles pour une visualisation complète
        // Pour les protéines (PDB), utiliser cartoon + stick pour les ligands
        // Pour les petites molécules (SDF), utiliser stick + sphere
        const isProtein = detectedFormat === 'pdb';
        
        // Détecter si c'est vraiment une protéine (a des ATOM) ou juste un ligand (seulement HETATM)
        const atomCount = (viewer as any).__atomCount || 0;
        const hetatmCount = (viewer as any).__hetatmCount || 0;
        const isRealProtein = isProtein && atomCount > 0;
        const isLargeProtein = isRealProtein && totalAtoms > 50;
        
        if (isLargeProtein) {
          // Style pour protéines complètes : cartoon pour la structure principale (ATOM uniquement)
          viewer.setStyle({ hetflag: false }, { 
            cartoon: { color: 'spectrum' }
          });
          // Stick pour les ligands (HETATM)
          if (hetatmCount > 0) {
            viewer.setStyle({ hetflag: true }, { 
              stick: { radius: 0.15 }
            });
            // Sphere pour les atomes des ligands
            viewer.setStyle({ hetflag: true }, { 
              sphere: { scale: 0.5 }
            });
          }
          console.log('Large protein style applied (cartoon for ATOM + stick + sphere for HETATM)');
        } else if (isProtein && atomCount === 0 && hetatmCount > 0) {
          // C'est un ligand seul (seulement HETATM, pas de protéine)
          // Utiliser stick + sphere - pas de cartoon car il n'y a pas d'ATOM
          // IMPORTANT: Pour les HETATM dans un PDB, il faut appliquer le style à tous les atomes
          // car ils sont tous marqués comme HETATM
          viewer.setStyle({}, { 
            stick: { radius: 0.2 },
            sphere: { scale: 0.6 }
          });
          console.log('Ligand-only PDB style applied (stick + sphere, no cartoon), atoms:', totalAtoms);
          
          // Vérifier que le style a été appliqué
          const checkModels = viewer.getModel();
          if (checkModels) {
            const checkArray = Array.isArray(checkModels) ? checkModels : [checkModels];
            console.log('Style check - models:', checkArray.length, 'atoms in first model:', checkArray[0]?.atoms?.length);
          }
        } else {
          // Style pour petites molécules ou protéines incomplètes : stick + sphere combinés
          viewer.setStyle({}, { 
            stick: { radius: 0.15 },
            sphere: { scale: 0.5 }
          });
          console.log('Small molecule/incomplete protein style applied (stick + sphere), atoms:', totalAtoms);
        }
        
        // S'assurer que le background est blanc AVANT de zoomer
        viewer.setBackgroundColor('white');
        console.log('Background color set to white');
        
        // Configurer les tooltips au survol des atomes avec changement de couleur
        const hoverContainer = containerRef.current;
        if (hoverContainer) {
          viewer.setHoverable(
            {}, // Sélectionner tous les atomes
            true, // Activer le hover
            function(atom: any, viewer: any, event: MouseEvent) {
              // Callback appelé quand on survole un atome
              if (atom && event && hoverContainer) {
                const rect = hoverContainer.getBoundingClientRect();
                setHoveredAtom({
                  atom,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                });
                
                // Changer légèrement la couleur de l'atome au survol
                // Utiliser une couleur jaune/brillante pour l'atome survolé (plus visible)
                // Appliquer le style hover à cet atome spécifique avec une couleur plus claire
                viewer.setStyle({ serial: atom.serial }, {
                  stick: { radius: 0.25, color: 'yellow' },
                  sphere: { scale: 0.75, color: 'yellow' }
                });
                viewer.render();
              }
            },
            function(atom: any) {
              // Callback appelé quand on quitte l'atome
              setHoveredAtom(null);
              
              // Restaurer le style original en réappliquant le style global
              // Cela va restaurer la couleur originale de l'atome
              if (atom && atom.serial !== undefined) {
                // Réappliquer le style global qui va restaurer les couleurs par défaut
                // On réapplique le style basé sur le type de molécule détecté précédemment
                const detectedFormat = format || 'sdf';
                const isProtein = detectedFormat === 'pdb';
                
                if (isProtein) {
                  // Pour les PDB, réappliquer le style approprié
                  viewer.setStyle({}, {
                    stick: { radius: 0.2 },
                    sphere: { scale: 0.6 }
                  });
                } else {
                  // Pour les SDF et autres, réappliquer le style par défaut
                  viewer.setStyle({}, {
                    stick: { radius: 0.15 },
                    sphere: { scale: 0.5 }
                  });
                }
                viewer.render();
              }
            }
          );
          console.log('Hover tooltips configured with color change');
        }
        
        // Centrer et zoomer sur la molécule
        viewer.zoomTo();
        console.log('Zoomed to molecule');
        
        // Rendre la scène - selon la doc, render() doit être appelé après chaque modification
        viewer.render();
        console.log('Viewer rendered');
        
        // Vérifier que les atomes sont bien visibles
        const finalModels = viewer.getModel();
        if (finalModels) {
          const finalModelArray = Array.isArray(finalModels) ? finalModels : [finalModels];
          const finalAtomCount = finalModelArray.reduce((sum, m) => sum + (m.atoms?.length || 0), 0);
          console.log('Final atom count after style:', finalAtomCount);
          
          if (finalAtomCount > 0) {
            // Vérifier les coordonnées des atomes pour debug
            if (finalModelArray.length > 0 && finalModelArray[0].atoms && finalModelArray[0].atoms.length > 0) {
              const firstAtom = finalModelArray[0].atoms[0];
              const lastAtom = finalModelArray[0].atoms[finalModelArray[0].atoms.length - 1];
              console.log('First atom:', firstAtom.elem, 'at', firstAtom.x, firstAtom.y, firstAtom.z);
              console.log('Last atom:', lastAtom.elem, 'at', lastAtom.x, lastAtom.y, lastAtom.z);
            }
            
            // Forcer un re-render pour s'assurer que tout est visible
            setTimeout(() => {
              if (viewer) {
                viewer.setBackgroundColor('white');
                viewer.zoomTo();
                viewer.render();
                console.log('Forced re-render with white background and zoom');
              }
            }, 200);
          }
        }
        
        // S'assurer que le conteneur a les bonnes dimensions et re-rendre si nécessaire
        // Attendre un peu pour que le DOM soit complètement rendu
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (viewer && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          console.log('Final container rect:', rect.width, rect.height);
          
          // Vérifier que les dimensions sont raisonnables
          if (rect.width > 0 && rect.height > 0 && rect.height < 10000) {
            // S'assurer que le conteneur prend toute la place
            containerRef.current.style.width = '100%';
            containerRef.current.style.height = '100%';
            
            // Forcer le resize du viewer avec les bonnes dimensions
            viewer.resize();
            
            // S'assurer que le background est blanc
            viewer.setBackgroundColor('white');
            
            // Re-zoomer et re-rendre
            viewer.zoomTo();
            viewer.render();
            console.log('Viewer re-rendered with final dimensions:', rect.width, rect.height);
          } else {
            console.warn('Invalid container dimensions, skipping resize:', rect.width, rect.height);
            // Utiliser des dimensions par défaut
            if (containerRef.current) {
              containerRef.current.style.width = '400px';
              containerRef.current.style.height = '400px';
              viewer.resize();
              viewer.setBackgroundColor('white');
              viewer.zoomTo();
              viewer.render();
            }
          }
        }

        // Gérer le redimensionnement
        resizeHandler = () => {
          if (viewer && containerRef.current) {
            viewer.resize();
          }
        };
        window.addEventListener('resize', resizeHandler);

        if (onViewerReady) {
          onViewerReady(viewer);
        }

        // Toujours arrêter le loading et le timeout
        isCompleted = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (isMounted) {
          setIsLoading(false);
          console.log('[MoleculeViewer] Loading completed successfully');
        }
      } catch (error) {
        // Toujours arrêter le loading et le timeout même en cas d'erreur
        isCompleted = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.error('[MoleculeViewer] Error loading 3Dmol:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        if (isMounted) {
          setError(errorMessage);
          setIsLoading(false);
          // Ne pas manipuler innerHTML directement, laisser React gérer l'affichage de l'erreur
        }
      }
    };

    load3Dmol();

    return () => {
      console.log('[MoleculeViewer] Cleanup function called');
      isMounted = false;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (viewerRef.current) {
        try {
          // Nettoyer le viewer 3Dmol - cela devrait nettoyer automatiquement le DOM
          if (viewerRef.current.clear) {
            viewerRef.current.clear();
          }
          // Essayer aussi dispose si disponible
          if (viewerRef.current.dispose) {
            viewerRef.current.dispose();
          }
        } catch (error) {
          console.warn('[MoleculeViewer] Error disposing 3Dmol viewer:', error);
        }
        viewerRef.current = null;
      }
      // Ne pas manipuler le DOM manuellement - 3Dmol.js et React gèrent le nettoyage
      // Le conteneur sera nettoyé automatiquement lors du prochain rendu
    };
  }, [codeContent, containerRef, onViewerReady, format]);

  if (error) {
    return (
      <div className="text-destructive p-4 text-sm">
        {error}
      </div>
    );
  }

  // Fonction pour formater les informations de l'atome
  const formatAtomInfo = (atom: any): string => {
    if (!atom) return '';
    
    const parts: string[] = [];
    
    // Élément chimique
    if (atom.elem) {
      parts.push(`Élément: ${atom.elem}`);
    }
    
    // Nom de l'atome (dans PDB: atom name)
    if (atom.atom) {
      parts.push(`Atome: ${atom.atom}`);
    }
    
    // Résidu (dans PDB: resn = residue name, resi = residue index)
    if (atom.resn) {
      parts.push(`Résidu: ${atom.resn}`);
      if (atom.resi) {
        parts[parts.length - 1] += ` (${atom.resi})`;
      }
    }
    
    // Chaîne (dans PDB: chain)
    if (atom.chain) {
      parts.push(`Chaîne: ${atom.chain}`);
    }
    
    // Coordonnées
    if (atom.x !== undefined && atom.y !== undefined && atom.z !== undefined) {
      parts.push(`Position: (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})`);
    }
    
    return parts.join('\n');
  };

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
          Chargement de la molécule...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-destructive text-sm p-4">
          {error}
        </div>
      )}
      
      {/* Tooltip pour afficher les informations de l'atome survolé */}
      {hoveredAtom && containerRef.current && (
        <div
          ref={tooltipRef}
          className="absolute z-50 pointer-events-none bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-2 text-xs max-w-xs"
          style={{
            left: `${Math.min(hoveredAtom.x + 10, containerRef.current.offsetWidth - 200)}px`,
            top: `${Math.min(hoveredAtom.y + 10, containerRef.current.offsetHeight - 150)}px`,
            transform: 'translate(0, 0)',
          }}
        >
          <div className="font-semibold mb-1 border-b border-border pb-1">
            {hoveredAtom.atom.elem || 'Atome'}
            {hoveredAtom.atom.atom && ` - ${hoveredAtom.atom.atom}`}
          </div>
          <div className="space-y-0.5 whitespace-pre-line">
            {formatAtomInfo(hoveredAtom.atom).split('\n').map((line, i) => (
              <div key={i} className="text-muted-foreground">{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Charger dynamiquement avec ssr: false pour éviter les problèmes avec Turbopack
export const MoleculeViewer = dynamic(() => Promise.resolve(MoleculeViewerInternal), {
  ssr: false,
  loading: () => <div className="text-muted-foreground p-4 text-sm text-center">Chargement de la molécule...</div>,
});
