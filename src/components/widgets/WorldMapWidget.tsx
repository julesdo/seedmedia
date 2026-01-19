"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DottedMap } from "@/components/ui/dotted-map";
import { useTranslations } from 'next-intl';

// Coordonnées simplifiées des pays (capitales)
const countryCoordinates: Record<string, [number, number]> = {
  "France": [48.8566, 2.3522],
  "United States": [38.9072, -77.0369],
  "Venezuela": [10.4806, -66.9036],
  "Ukraine": [50.4501, 30.5234],
  "North Korea": [39.0392, 125.7625],
  "Burkina Faso": [12.3714, -1.5197],
  "Central African Republic": [4.3947, 18.5582],
  "Russia": [55.7558, 37.6173],
  "China": [39.9042, 116.4074],
  "Germany": [52.5200, 13.4050],
  "United Kingdom": [51.5074, -0.1278],
  "Japan": [35.6762, 139.6503],
  "Iran": [35.6892, 51.3890],
  "Israel": [31.7683, 35.2137],
  "Palestine": [31.9522, 35.2332],
  "European Union": [50.8503, 4.3517],
  "NATO": [50.8790, 4.4220],
  "United Nations": [40.748817, -73.985428],
  "International Criminal Court": [52.0787, 4.2904],
  "Brazil": [-15.7942, -47.8822],
  "India": [28.6139, 77.2090],
  "South Korea": [37.5665, 126.9780],
  "Saudi Arabia": [24.7136, 46.6753],
  "Turkey": [39.9334, 32.8597],
  "Egypt": [30.0444, 31.2357],
  "South Africa": [-25.7461, 28.1881],
  "Mexico": [19.4326, -99.1332],
  "Canada": [45.4215, -75.6972],
  "Australia": [-35.2809, 149.1300],
  "Argentina": [-34.6037, -58.3816],
  "Chile": [-33.4489, -70.6693],
  "Peru": [-12.0464, -77.0428],
  "Colombia": [4.7110, -74.0721],
  "Nigeria": [9.0765, 7.3986],
  "Kenya": [-1.2921, 36.8219],
  "Ethiopia": [9.1450, 38.7667],
  "Pakistan": [33.6844, 73.0479],
  "Bangladesh": [23.8103, 90.4125],
  "Indonesia": [-6.2088, 106.8456],
  "Thailand": [13.7563, 100.5018],
  "Vietnam": [21.0285, 105.8542],
  "Philippines": [14.5995, 120.9842],
  "Malaysia": [3.1390, 101.6869],
  "Singapore": [1.3521, 103.8198],
  "Poland": [52.2297, 21.0122],
  "Italy": [41.9028, 12.4964],
  "Spain": [40.4168, -3.7038],
  "Netherlands": [52.3676, 4.9041],
  "Belgium": [50.8503, 4.3517],
  "Sweden": [59.3293, 18.0686],
  "Norway": [59.9139, 10.7522],
  "Denmark": [55.6761, 12.5683],
  "Finland": [60.1699, 24.9384],
  "Greece": [37.9838, 23.7275],
  "Portugal": [38.7223, -9.1393],
  "Switzerland": [46.2044, 6.1432],
  "Austria": [48.2082, 16.3738],
  "Czech Republic": [50.0755, 14.4378],
  "Hungary": [47.4979, 19.0402],
  "Romania": [44.4268, 26.1025],
  "Bulgaria": [42.6977, 23.3219],
  "Croatia": [45.8150, 15.9819],
  "Serbia": [44.7866, 20.4489],
  "Algeria": [36.7538, 3.0588],
  "Morocco": [33.9716, -6.8498],
  "Tunisia": [36.8065, 10.1815],
  "Libya": [32.8872, 13.1913],
  "Sudan": [15.5007, 32.5599],
  "Iraq": [33.3152, 44.3661],
  "Syria": [33.5138, 36.2765],
  "Lebanon": [33.8547, 35.8623],
  "Jordan": [31.9539, 35.9106],
  "Yemen": [15.3694, 44.1910],
  "Oman": [23.5859, 58.4059],
  "United Arab Emirates": [24.4539, 54.3773],
  "Qatar": [25.2854, 51.5310],
  "Kuwait": [29.3759, 47.9774],
  "Kazakhstan": [51.1694, 71.4491],
  "Uzbekistan": [41.2995, 69.2401],
  "Afghanistan": [34.5553, 69.2075],
  "Myanmar": [16.8661, 96.1951],
  "Cambodia": [11.5564, 104.9282],
  "Laos": [17.9757, 102.6331],
  "Mongolia": [47.8864, 106.9057],
  "Nepal": [27.7172, 85.3240],
  "Sri Lanka": [6.9271, 79.8612],
  "New Zealand": [-41.2865, 174.7762],
  "Fiji": [-18.1416, 178.4419],
  "Papua New Guinea": [-9.4438, 147.1803],
};

// Fonction pour géocoder le décideur
function geocodeDecider(decider: string, deciderType: "country" | "institution" | "leader" | "organization"): [number, number] | null {
  const lowerDecider = decider.toLowerCase();

  // Priorité aux pays
  if (countryCoordinates[decider]) {
    return countryCoordinates[decider];
  }

  // Gérer les institutions
  if (deciderType === "institution" || deciderType === "organization") {
    if (lowerDecider.includes("union européenne") || lowerDecider.includes("european union") || lowerDecider.includes("ue")) {
      return countryCoordinates["European Union"];
    }
    if (lowerDecider.includes("otan") || lowerDecider.includes("nato")) {
      return countryCoordinates["NATO"];
    }
    if (lowerDecider.includes("nations unies") || lowerDecider.includes("united nations") || lowerDecider.includes("onu")) {
      return countryCoordinates["United Nations"];
    }
    if (lowerDecider.includes("cour pénale internationale") || lowerDecider.includes("international criminal court") || lowerDecider.includes("cpi")) {
      return countryCoordinates["International Criminal Court"];
    }
  }

  // Gérer les leaders en essayant de trouver leur pays
  if (deciderType === "leader") {
    if (lowerDecider.includes("maduro")) return countryCoordinates["Venezuela"];
    if (lowerDecider.includes("zelensky")) return countryCoordinates["Ukraine"];
    if (lowerDecider.includes("kim jong un")) return countryCoordinates["North Korea"];
    if (lowerDecider.includes("macron")) return countryCoordinates["France"];
    if (lowerDecider.includes("biden")) return countryCoordinates["United States"];
    if (lowerDecider.includes("poutine")) return countryCoordinates["Russia"];
    if (lowerDecider.includes("xi jinping")) return countryCoordinates["China"];
  }

  // Fallback pour les pays mentionnés dans le titre si le décideur n'est pas direct
  for (const countryName in countryCoordinates) {
    if (lowerDecider.includes(countryName.toLowerCase())) {
      return countryCoordinates[countryName];
    }
  }

  return null;
}


/**
 * Widget : Carte du monde avec points d'événements
 */
export function WorldMapWidget() {
  const router = useRouter();
  const t = useTranslations('widgets.worldMap');
  const decisions = useQuery(api.decisions.getDecisions, { limit: 100 });

  // Créer les markers pour les événements
  const markers = useMemo(() => {
    if (!decisions) return [];

    const markersMap = new Map<string, { lat: number; lng: number; count: number }>();

    decisions.forEach((decision) => {
      const coords = geocodeDecider(decision.decider, decision.deciderType);
      if (coords) {
        const key = `${coords[0]},${coords[1]}`;
        const existing = markersMap.get(key);
        if (existing) {
          markersMap.set(key, { lat: coords[0], lng: coords[1], count: existing.count + 1 });
        } else {
          markersMap.set(key, { lat: coords[0], lng: coords[1], count: 1 });
        }
      }
    });

    // Convertir en array de markers avec taille proportionnelle au nombre d'événements
    return Array.from(markersMap.values()).map((marker) => ({
      lat: marker.lat,
      lng: marker.lng,
      size: Math.min(0.5, 0.25 + (marker.count / 20)), // Taille entre 0.25 et 0.5 selon le nombre d'événements
    }));
  }, [decisions]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="global-bold" className="size-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t('title')}
        </h4>
      </div>
      <div 
        className="relative w-full rounded-lg overflow-hidden border border-border/50 bg-muted/20 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => router.push("/portfolio")}
      >
        <DottedMap
          width={280}
          height={140}
          mapSamples={3000}
          markers={markers}
          dotColor="rgb(148, 163, 184)" // Gris-bleu pour les points par défaut
          markerColor="rgb(59, 130, 246)" // Bleu pour les événements
          dotRadius={0.2}
          stagger={true}
          className="text-slate-400 dark:text-slate-500"
        />
        {/* Overlay pour indiquer que c'est cliquable */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/50">
          <span className="text-xs font-medium text-foreground">{t('seeFullMap')}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {markers.length} {markers.length === 1 ? t('activeZone') : t('activeZones')}
      </p>
    </div>
  );
}

