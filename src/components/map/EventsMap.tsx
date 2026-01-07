"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L, { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "next-themes";
import { MapDecisionCard } from "./MapDecisionCard";

// Fonction pour calculer la couleur du badge (identique à celle dans generateDecision.ts)
function calculateBadgeColor(heat: number, sentiment: "positive" | "negative" | "neutral"): string {
  const normalizedHeat = Math.max(0, Math.min(100, heat)) / 100;
  
  let hue: number;
  if (sentiment === "positive") {
    hue = 120 - (normalizedHeat * 30); // 120° (vert) à 90° (vert-jaune)
  } else if (sentiment === "negative") {
    hue = 0 + (normalizedHeat * 30); // 0° (rouge) à 30° (rouge-orange)
  } else {
    hue = 210 - (normalizedHeat * 210); // 210° (bleu) → 0° (rouge)
  }
  
  const saturation = 60 + (normalizedHeat * 30); // 60% à 90%
  const lightness = 50 - (normalizedHeat * 10); // 50% à 40%
  
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h * 6 < 1) {
    r = c; g = x; b = 0;
  } else if (h * 6 < 2) {
    r = x; g = c; b = 0;
  } else if (h * 6 < 3) {
    r = 0; g = c; b = x;
  } else if (h * 6 < 4) {
    r = 0; g = x; b = c;
  } else if (h * 6 < 5) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Fonction pour créer une icône personnalisée avec emoji
function createEmojiIcon(
  emoji: string, 
  badgeColor: string, 
  isHovered: boolean = false,
  isActive: boolean = false
) {
  const baseSize = 40;
  const hoverSize = 50;
  const size = isHovered ? hoverSize : baseSize;
  const fontSize = isHovered ? 28 : 24;
  const scale = isHovered ? 1.25 : 1;
  
  return divIcon({
    className: "custom-emoji-marker",
    html: `
      <div class="marker-container" style="
        position: relative;
        width: ${baseSize}px;
        height: ${baseSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isActive ? `
          <div class="marker-ping" style="
            position: absolute;
            width: ${baseSize * 3}px;
            height: ${baseSize * 3}px;
            border-radius: 50%;
            background-color: ${badgeColor};
            opacity: 0.4;
            animation: marker-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            transform: translate(-50%, -50%);
            top: 50%;
            left: 50%;
            pointer-events: none;
          "></div>
        ` : ''}
        <div style="
          width: ${baseSize}px;
          height: ${baseSize}px;
          border-radius: 50%;
          background-color: ${badgeColor};
          border: ${isActive ? '3px' : '2px'} solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${fontSize}px;
          box-shadow: ${isActive ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)'};
          cursor: pointer;
          transition: all 0.2s ease;
          transform: scale(${scale});
          z-index: ${isHovered || isActive ? 1000 : 100};
          position: relative;
        ">
          ${emoji}
        </div>
      </div>
      <style>
        @keyframes marker-ping {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.4;
          }
          50% {
            opacity: 0.2;
          }
          75%, 100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      </style>
    `,
    iconSize: [baseSize, baseSize],
    iconAnchor: [baseSize / 2, baseSize / 2],
    popupAnchor: [0, -baseSize / 2],
  });
}

// Fonction pour décaler les markers qui ont les mêmes coordonnées
function offsetMarkers(
  decisionsWithCoords: { decision: Decision; coords: [number, number] }[]
): { decision: Decision; coords: [number, number]; originalIndex: number }[] {
  const offsetDistance = 0.08; // ~8.8km de décalage pour mieux voir les markers
  const coordsMap = new Map<string, number[]>();
  
  return decisionsWithCoords.map((item, index) => {
    const key = `${item.coords[0].toFixed(3)},${item.coords[1].toFixed(3)}`;
    const existing = coordsMap.get(key);
    
    if (!existing) {
      coordsMap.set(key, [0]);
      return { ...item, originalIndex: index };
    }
    
    // Calculer l'offset en spirale
    const count = existing.length;
    const angle = (count * 45) * (Math.PI / 180); // 45 degrés entre chaque marker
    const radius = offsetDistance * (1 + Math.floor(count / 8)); // Augmenter le rayon tous les 8 markers
    
    const offsetLat = radius * Math.cos(angle);
    const offsetLng = radius * Math.sin(angle);
    
    existing.push(count);
    coordsMap.set(key, existing);
    
    return {
      ...item,
      coords: [item.coords[0] + offsetLat, item.coords[1] + offsetLng] as [number, number],
      originalIndex: index,
    };
  });
}

interface Decision {
  _id: Id<"decisions">;
  title: string;
  slug: string;
  decider: string;
  deciderType: "country" | "institution" | "leader" | "organization";
  date: number;
  type: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other";
  sentiment: "positive" | "negative" | "neutral";
  heat: number;
  emoji: string;
  badgeColor: string;
  status: "announced" | "tracking" | "resolved";
  imageUrl?: string;
}

interface EventsMapProps {
  decisions: Decision[];
  className?: string;
}

// Mapping des pays vers leurs coordonnées (capitale)
const countryCoordinates: Record<string, [number, number]> = {
  // Europe
  "France": [48.8566, 2.3522], // Paris
  "Allemagne": [52.5200, 13.4050], // Berlin
  "Royaume-Uni": [51.5074, -0.1278], // Londres
  "Espagne": [40.4168, -3.7038], // Madrid
  "Italie": [41.9028, 12.4964], // Rome
  "Pologne": [52.2297, 21.0122], // Varsovie
  "Ukraine": [50.4501, 30.5234], // Kiev
  "Russie": [55.7558, 37.6173], // Moscou
  "Turquie": [39.9334, 32.8597], // Ankara
  "Grèce": [37.9838, 23.7275], // Athènes
  "Portugal": [38.7223, -9.1393], // Lisbonne
  "Belgique": [50.8503, 4.3517], // Bruxelles
  "Pays-Bas": [52.3676, 4.9041], // Amsterdam
  "Suisse": [46.2044, 6.1432], // Genève
  "Autriche": [48.2082, 16.3738], // Vienne
  "Suède": [59.3293, 18.0686], // Stockholm
  "Norvège": [59.9139, 10.7522], // Oslo
  "Danemark": [55.6761, 12.5683], // Copenhague
  "Finlande": [60.1699, 24.9384], // Helsinki
  "Irlande": [53.3498, -6.2603], // Dublin
  
  // Amériques
  "États-Unis": [38.9072, -77.0369], // Washington DC
  "États-Unis d'Amérique": [38.9072, -77.0369],
  "USA": [38.9072, -77.0369],
  "Canada": [45.5017, -73.5673], // Ottawa
  "Mexique": [19.4326, -99.1332], // Mexico
  "Brésil": [-15.7942, -47.8822], // Brasília
  "Argentine": [-34.6037, -58.3816], // Buenos Aires
  "Chili": [-33.4489, -70.6693], // Santiago
  "Colombie": [4.7110, -74.0721], // Bogotá
  "Venezuela": [10.4806, -66.9036], // Caracas
  "Pérou": [-12.0464, -77.0428], // Lima
  
  // Asie
  "Chine": [39.9042, 116.4074], // Pékin
  "Japon": [35.6762, 139.6503], // Tokyo
  "Inde": [28.6139, 77.2090], // New Delhi
  "Corée du Sud": [37.5665, 126.9780], // Séoul
  "Corée du Nord": [39.0392, 125.7625], // Pyongyang
  "Indonésie": [-6.2088, 106.8456], // Jakarta
  "Thaïlande": [13.7563, 100.5018], // Bangkok
  "Vietnam": [21.0285, 105.8542], // Hanoï
  "Philippines": [14.5995, 120.9842], // Manille
  "Malaisie": [3.1390, 101.6869], // Kuala Lumpur
  "Singapour": [1.3521, 103.8198], // Singapour
  "Pakistan": [33.6844, 73.0479], // Islamabad
  "Bangladesh": [23.8103, 90.4125], // Dhaka
  "Sri Lanka": [6.9271, 79.8612], // Colombo
  
  // Moyen-Orient
  "Arabie Saoudite": [24.7136, 46.6753], // Riyad
  "Iran": [35.6892, 51.3890], // Téhéran
  "Irak": [33.3152, 44.3661], // Bagdad
  "Israël": [31.7683, 35.2137], // Jérusalem
  "Palestine": [31.7683, 35.2137], // Jérusalem
  "Égypte": [30.0444, 31.2357], // Le Caire
  "Turquie": [39.9334, 32.8597], // Ankara
  "Syrie": [33.5138, 36.2765], // Damas
  "Liban": [33.8938, 35.5018], // Beyrouth
  "Jordanie": [31.9539, 35.9106], // Amman
  "Émirats arabes unis": [24.4539, 54.3773], // Abou Dabi
  "Qatar": [25.2854, 51.5310], // Doha
  "Koweït": [29.3759, 47.9774], // Koweït City
  
  // Afrique
  "Afrique du Sud": [-25.7461, 28.1881], // Pretoria
  "Nigeria": [9.0765, 7.3986], // Abuja
  "Kenya": [-1.2921, 36.8219], // Nairobi
  "Éthiopie": [9.1450, 38.7667], // Addis-Abeba
  "Ghana": [5.6037, -0.1870], // Accra
  "Sénégal": [14.7167, -17.4677], // Dakar
  "Maroc": [34.0209, -6.8416], // Rabat
  "Algérie": [36.7538, 3.0588], // Alger
  "Tunisie": [36.8065, 10.1815], // Tunis
  "Égypte": [30.0444, 31.2357], // Le Caire
  "Burkina Faso": [12.3714, -1.5197], // Ouagadougou
  "Mali": [12.6392, -8.0029], // Bamako
  "Niger": [13.5127, 2.1128], // Niamey
  "Tchad": [12.1348, 15.0557], // N'Djamena
  "République centrafricaine": [4.3947, 18.5582], // Bangui
  "Congo": [-4.2634, 15.2429], // Brazzaville
  "RDC": [-4.4419, 15.2663], // Kinshasa (République démocratique du Congo)
  "République démocratique du Congo": [-4.4419, 15.2663], // Kinshasa
  
  // Océanie
  "Australie": [-35.2809, 149.1300], // Canberra
  "Nouvelle-Zélande": [-41.2865, 174.7762], // Wellington
  
  // Institutions internationales
  "ONU": [40.7489, -73.9680], // New York
  "Organisation des Nations Unies": [40.7489, -73.9680],
  "OTAN": [50.8756, 4.4214], // Bruxelles
  "Union européenne": [50.8503, 4.3517], // Bruxelles
  "UE": [50.8503, 4.3517],
  "FMI": [38.8977, -77.0369], // Washington DC
  "Banque mondiale": [38.8991, -77.0429], // Washington DC
  "OMS": [46.2276, 6.1403], // Genève
  "UNESCO": [48.8496, 2.3069], // Paris
};

// Fonction pour géocoder un décideur
function geocodeDecider(decider: string, deciderType: string): [number, number] | null {
  // Normaliser le nom
  const normalized = decider.trim();
  
  // Chercher dans le mapping
  if (countryCoordinates[normalized]) {
    return countryCoordinates[normalized];
  }
  
  // Chercher avec des variations
  for (const [country, coords] of Object.entries(countryCoordinates)) {
    if (normalized.toLowerCase().includes(country.toLowerCase()) || 
        country.toLowerCase().includes(normalized.toLowerCase())) {
      return coords;
    }
  }
  
  // Si c'est un leader, essayer d'extraire le pays
  if (deciderType === "leader") {
    // Patterns communs : "Président [Pays]", "Premier ministre [Pays]", etc.
    for (const [country, coords] of Object.entries(countryCoordinates)) {
      if (normalized.toLowerCase().includes(country.toLowerCase())) {
        return coords;
      }
    }
  }
  
  return null;
}

// Composant pour centrer sur un marker spécifique
function MapCenterer({ 
  coords, 
  zoom = 6 
}: { 
  coords: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();
  const lastCoordsRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (coords) {
      const coordsKey = `${coords[0]},${coords[1]}`;
      // Ne centrer que si les coordonnées ont changé
      if (lastCoordsRef.current !== coordsKey) {
        lastCoordsRef.current = coordsKey;
        map.flyTo(coords, zoom, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
      }
    }
  }, [coords, zoom, map]);
  
  return null;
}

// Composant pour ajuster la vue de la carte initiale (une seule fois au montage)
function MapViewAdjuster({ 
  coordinates 
}: { 
  coordinates: [number, number][] 
}) {
  const map = useMap();
  const hasAdjustedRef = useRef(false);
  
  useEffect(() => {
    // Ne s'exécuter qu'une seule fois au montage
    if (hasAdjustedRef.current) return;
    
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
      hasAdjustedRef.current = true;
    } else {
      // Vue par défaut : monde entier
      map.setView([20, 0], 2);
      hasAdjustedRef.current = true;
    }
  }, [coordinates, map]);
  
  return null;
}

// Composant pour changer les tuiles selon le thème
function ThemeAwareTileLayer() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Attendre que le thème soit résolu pour éviter le flash
  if (!mounted) {
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    );
  }
  
  const isDark = resolvedTheme === "dark" || theme === "dark";
  
  // Tuiles dark mode (CartoDB Dark Matter)
  if (isDark) {
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
    );
  }
  
  // Tuiles light mode (OpenStreetMap standard)
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}

export function EventsMap({ decisions, className }: EventsMapProps) {
  const router = useRouter();
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [activeDecisionIndex, setActiveDecisionIndex] = useState(0);
  
  // Filtrer les décisions avec des coordonnées valides
  const decisionsWithCoords = useMemo(() => {
    return decisions
      .map((decision) => {
        const coords = geocodeDecider(decision.decider, decision.deciderType);
        return coords ? { decision, coords } : null;
      })
      .filter((item): item is { decision: Decision; coords: [number, number] } => item !== null);
  }, [decisions]);

  // Décaler les markers qui ont les mêmes coordonnées
  const decisionsWithOffsetCoords = useMemo(() => {
    return offsetMarkers(decisionsWithCoords);
  }, [decisionsWithCoords]);

  // Mémoriser les coordonnées pour MapViewAdjuster (évite les re-renders)
  const coordinatesForBounds = useMemo(() => {
    return decisionsWithOffsetCoords.map(item => item.coords);
  }, [decisionsWithOffsetCoords]);

  // Décision active actuelle (utiliser l'index original pour trouver la bonne décision)
  const activeDecision = decisionsWithOffsetCoords[activeDecisionIndex];
  const activeDecisionId = activeDecision?.decision._id;
  const activeCoords = activeDecision?.coords || null;

  // Navigation entre les décisions
  const handleSwipeLeft = () => {
    if (activeDecisionIndex < decisionsWithOffsetCoords.length - 1) {
      setActiveDecisionIndex(activeDecisionIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (activeDecisionIndex > 0) {
      setActiveDecisionIndex(activeDecisionIndex - 1);
    }
  };

  // Activer une décision depuis un marker
  const handleMarkerClick = (decisionId: string) => {
    const index = decisionsWithOffsetCoords.findIndex(
      (item) => item.decision._id === decisionId
    );
    if (index !== -1) {
      setActiveDecisionIndex(index);
    }
  };

  if (decisionsWithOffsetCoords.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted rounded-lg", className)}>
        <div className="text-center space-y-2">
          <SolarIcon icon="map-point-bold" className="size-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Aucun événement localisable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full rounded-lg overflow-hidden border relative", className)}>
      {/* Légende avec une seule bande de dégradé continue (vert → jaune/orange → rouge) */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex justify-center pt-2 px-2 safe-area-inset-top">
        <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-lg max-w-full">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-semibold text-foreground text-[10px] sm:text-xs shrink-0">Impact :</span>
              
              {/* Bande unique de dégradé vert → jaune/orange → rouge */}
              <div className="relative flex-1 max-w-md min-w-0">
                <div 
                  className="h-6 sm:h-8 rounded border-2 border-white shadow-sm relative overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, 
                      #22c55e,  /* Vert foncé (progrès chaud) */
                      #4ade80,  /* Vert moyen */
                      #86efac,  /* Vert clair (progrès froid) */
                      #fbbf24,  /* Jaune (neutre froid) */
                      #fb923c,  /* Orange (neutre moyen) */
                      #f97316,  /* Orange foncé (neutre chaud) */
                      #fca5a5,  /* Rouge clair (crise froid) */
                      #f87171,  /* Rouge moyen */
                      #ef4444   /* Rouge foncé (crise chaud) */
                    )`
                  }}
                >
                  {/* Séparateurs verticaux pour les zones */}
                  <div className="absolute left-[33.33%] top-0 bottom-0 w-0.5 bg-white/90 shadow-sm" />
                  <div className="absolute left-[66.66%] top-0 bottom-0 w-0.5 bg-white/90 shadow-sm" />
                </div>
                
                {/* Labels sous la bande */}
                <div className="flex justify-between mt-1 text-[9px] sm:text-[10px]">
                  <span className="font-medium text-foreground truncate">💚 Progrès</span>
                  <span className="font-medium text-foreground truncate">⚪ Neutre</span>
                  <span className="font-medium text-foreground truncate">🔴 Crise</span>
                </div>
              </div>
            </div>
            
            {/* Indicateur froid → chaud */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground">
              <span className="truncate">❄️ Froid</span>
              <span>→</span>
              <span className="truncate">🔥 Chaud</span>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
      >
        <ThemeAwareTileLayer />
        <MapViewAdjuster coordinates={coordinatesForBounds} />
        <MapCenterer coords={activeCoords} zoom={6} />
        {decisionsWithOffsetCoords.map(({ decision, coords }) => {
          const isHovered = hoveredMarker === decision._id;
          const isActive = activeDecisionId === decision._id;
          // Recréer l'icône à chaque changement d'état hover/active
          const emojiIcon = createEmojiIcon(decision.emoji, decision.badgeColor, isHovered, isActive);
          
          return (
            <Marker
              key={`${decision._id}-${isHovered}-${isActive}`} // Force la recréation du Marker au hover/active
              position={coords}
              icon={emojiIcon}
              eventHandlers={{
                click: () => {
                  handleMarkerClick(decision._id);
                },
                mouseover: () => {
                  setHoveredMarker(decision._id);
                },
                mouseout: () => {
                  setHoveredMarker(null);
                },
              }}
            />
          );
        })}
      </MapContainer>

      {/* Card flottante en bas avec swipe */}
      {activeDecision && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none pb-4 px-4 lg:px-16 safe-area-inset-bottom">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <MapDecisionCard
              decision={activeDecision.decision}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onNavigateLeft={handleSwipeRight}
              onNavigateRight={handleSwipeLeft}
              canNavigateLeft={activeDecisionIndex > 0}
              canNavigateRight={activeDecisionIndex < decisionsWithOffsetCoords.length - 1}
            />
            {/* Indicateur de position */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {decisionsWithOffsetCoords.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveDecisionIndex(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    index === activeDecisionIndex
                      ? "w-8 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Aller à la décision ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

