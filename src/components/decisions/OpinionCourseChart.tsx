"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";

interface OpinionCourseChartProps {
  decisionId: Id<"decisions">;
  compact?: boolean; // Mode mobile compact
  hideLabels?: boolean; // Cacher tous les labels et chiffres (tendance uniquement)
  hideBottomElements?: boolean; // Cacher les éléments en bas (axes, labels du bas)
  fullHeight?: boolean; // Prendre toute la hauteur disponible
  position?: "yes" | "no"; // Position à afficher (Oui ou Non) - si non spécifié, affiche Oui par défaut
}

/**
 * 🎯 FEATURE 2: LE TRADING - Graphique de cours des opinions en temps réel (style bourse)
 * Utilise Apache ECharts pour un graphique performant avec zoom, pan et toutes les features
 */
export function OpinionCourseChart({ decisionId, compact = false, hideLabels = false, hideBottomElements = false, fullHeight = false, position = "yes" }: OpinionCourseChartProps) {
  const { theme } = useTheme();

  // Récupérer l'historique des cours avec prix normalisés
  // @ts-expect-error - Convex type inference issue
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, {
    decisionId,
  });

  // Récupérer les transactions pour les marqueurs (optionnel)
  const tradingHistory = useQuery(
    api.trading.getTradingHistory,
    { decisionId, limit: 1000 }
  );

  // Préparer les données pour ECharts
  const chartOption = useMemo(() => {
    // Détecter le thème de manière plus robuste
    const isDark = typeof window !== "undefined" && (
      theme === "dark" || 
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      document.documentElement.classList.contains("dark")
    );

    // Utiliser l'historique des cours avec prix normalisés
    if (!courseHistory || courseHistory.history.length === 0) {
      console.log("OpinionCourseChart: No course history", courseHistory);
      return null;
    }

    const { history } = courseHistory;
    console.log("OpinionCourseChart: Processing course history", {
      historyLength: history.length,
      firstPoint: history[0],
      lastPoint: history[history.length - 1],
    });

    // Formater les données pour ECharts - COURBE UNIQUE de probabilité (0-100%)
    // ECharts attend des timestamps en millisecondes pour l'axe X (time)
    const probabilityData: [number, number][] = [];

    history.forEach((point) => {
      // Convertir le timestamp en millisecondes pour ECharts
      const timestamp = point.timestamp || (typeof point.time === 'number' && point.time > 0
        ? point.time * 1000 // Convertir secondes en millisecondes
        : Date.now());

      // Calculer la probabilité depuis les liquidités yes/no
      const yesLiquidity = point.yes || 0;
      const noLiquidity = point.no || 0;
      const totalLiquidity = yesLiquidity + noLiquidity;
      
      // Probabilité selon la position : Oui = probabilité Oui, Non = probabilité Non
      const probability = totalLiquidity > 0 
        ? (position === "yes" 
          ? (yesLiquidity / totalLiquidity) * 100 
          : (noLiquidity / totalLiquidity) * 100)
        : 50; // Par défaut 50% si aucune liquidité

      if (!isNaN(Number(probability)) && Number(probability) >= 0 && Number(probability) <= 100) {
        probabilityData.push([timestamp, Number(probability)]);
      }
    });

    // Trier par timestamp
    probabilityData.sort((a, b) => a[0] - b[0]);

    console.log("OpinionCourseChart: Formatted data", {
      probabilityDataLength: probabilityData.length,
      probabilityDataSample: probabilityData.slice(0, 3),
    });

    // Si aucune donnée, retourner null
    if (probabilityData.length === 0) {
      console.warn("OpinionCourseChart: No valid data points after formatting");
      return null;
    }

    return {
      backgroundColor: "transparent",
      textStyle: {
        color: isDark ? "#ffffff" : "#000000",
        fontFamily: "inherit",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
          },
        },
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
        textStyle: {
          color: isDark ? "#ffffff" : "#000000",
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return "";
          
          // Calculer le point de référence (premier point de l'historique)
          const firstPoint = history[0];
          const firstYes = firstPoint?.yes || 0;
          const firstNo = firstPoint?.no || 0;
          const firstTotal = firstYes + firstNo;
          const firstProbability = firstTotal > 0 ? (firstYes / firstTotal) * 100 : 50;
          
          let result = `<div style="padding: ${compact ? "4px" : "8px"}; font-size: ${compact ? "11px" : "12px"}"><strong>${new Date(params[0].axisValue).toLocaleString("fr-FR")}</strong><br/>`;
          params.forEach((param: any) => {
            const probability = param.value[1];
            const variationPercent = firstProbability > 0 
              ? Math.round(((probability - firstProbability) / firstProbability) * 100)
              : 0;
            const sign = variationPercent > 0 ? "+" : "";
            const color = variationPercent > 0 ? "#22c55e" : variationPercent < 0 ? "#ef4444" : "#ffffff";
            result += `<div style="margin-top: 2px;">
              <span style="display:inline-block;width:${compact ? "8" : "10"}px;height:${compact ? "8" : "10"}px;border-radius:50%;background-color:${param.color};margin-right:4px;"></span>
              Probabilité: <strong>${probability.toFixed(1)}%</strong> <span style="color:${color}">(${sign}${variationPercent}%)</span>
            </div>`;
          });
          result += "</div>";
          return result;
        },
      },
      legend: {
        show: false, // Légende désactivée
      },
      grid: {
        left: hideLabels ? "0%" : compact ? "8%" : "3%",
        right: hideLabels ? "0%" : compact ? "4%" : "4%",
        bottom: hideLabels ? "0%" : compact ? "15%" : "10%",
        top: hideLabels ? "0%" : compact ? "8%" : "15%",
        containLabel: !hideLabels,
      },
      xAxis: {
        type: "time",
        boundaryGap: false,
        scale: true,
        axisLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          },
        },
        axisLabel: {
          show: !hideLabels && !hideBottomElements,
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
          fontSize: compact ? 10 : 12,
          formatter: (value: number) => {
            if (hideLabels || hideBottomElements) return "";
            const date = new Date(value);
            if (compact) {
              // Format ultra-compact pour mobile : JJ/MM HH:mm
              return date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).replace(/\s/g, " ");
            }
            return date.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          },
        },
        axisLine: {
          show: !hideBottomElements,
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          },
        },
        splitLine: {
          show: !hideBottomElements,
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            type: "dashed",
          },
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        name: "Probabilité (%)",
        nameTextStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
        },
        axisLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          },
        },
          axisLabel: {
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
          fontSize: compact ? 10 : 12,
          formatter: (value: number) => {
            // Format pour probabilité : afficher en pourcentage
            return `${Math.round(value)}%`;
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            type: "dashed",
          },
        },
      },
      dataZoom: compact ? [
        {
          type: "inside",
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
          // Optimisations mobile
          preventDefaultMouseMove: true,
        },
      ] : [
        {
          type: "inside",
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
          preventDefaultMouseMove: true,
        },
        {
          type: "slider",
          start: 0,
          end: 100,
          height: 20,
          handleIcon: "M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23.1h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z",
          handleSize: "80%",
          handleStyle: {
            color: isDark ? "#ffffff" : "#000000",
            shadowBlur: 3,
            shadowColor: "rgba(0, 0, 0, 0.6)",
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
          textStyle: {
            color: isDark ? "#ffffff" : "#000000",
          },
          borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          fillerColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          // Masquer le slider sur mobile pour plus d'espace
          show: !compact,
        },
      ],
      series: [
        {
          name: "Probabilité",
          type: "line",
          data: probabilityData.length > 0 ? probabilityData : [[Date.now(), 50]],
          smooth: true,
          symbol: probabilityData.length > 1 ? "none" : "circle",
          symbolSize: probabilityData.length === 1 ? 8 : 0,
          lineStyle: {
            width: 2.5,
            color: position === "yes" ? YES_COLORS.chart.light : NO_COLORS.chart.light,
            shadowBlur: 4,
            shadowColor: position === "yes" 
              ? (isDark ? "rgba(36, 107, 253, 0.3)" : "rgba(36, 107, 253, 0.2)")
              : (isDark ? "rgba(113, 113, 122, 0.3)" : "rgba(113, 113, 122, 0.2)"),
          },
          itemStyle: {
            color: position === "yes" ? YES_COLORS.chart.light : NO_COLORS.chart.light,
          },
          areaStyle: probabilityData.length > 0 ? {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: position === "yes" ? YES_COLORS.chart.gradient.start : NO_COLORS.chart.gradient.start,
                },
                {
                  offset: 0.5,
                  color: position === "yes" 
                    ? "rgba(36, 107, 253, 0.15)" 
                    : NO_COLORS.chart.gradient.middle || "rgba(113, 113, 122, 0.15)",
                },
                {
                  offset: 1,
                  color: position === "yes" ? YES_COLORS.chart.gradient.end : NO_COLORS.chart.gradient.end,
                },
              ],
            },
          } : undefined,
          emphasis: {
            focus: "series",
          },
        },
      ],
    };
  }, [courseHistory, theme, compact, hideLabels, hideBottomElements, position]);

  // Si mode compact, on retourne juste le contenu
  if (compact) {
    if (courseHistory === undefined) {
      return <Skeleton className={cn("w-full", compact ? "h-48" : "h-96")} />;
    }

    if (!courseHistory || courseHistory.history.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Pas encore de données
          </p>
        </div>
      );
    }
  } else {
    if (courseHistory === undefined) {
      return (
        <div className="w-full">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }

    if (!courseHistory || courseHistory.history.length === 0) {
      return (
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <SolarIcon icon="chart-line-up-bold" className="size-5 text-primary" />
            <h3 className="text-lg font-bold">Évolution de la Probabilité</h3>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de données. La probabilité sera disponible après le premier vote.
            </p>
          </div>
        </div>
      );
    }
  }

  const { history, current } = courseHistory;

  // 🎯 Calculer la variation de probabilité
  // Méthode standard : variation depuis l'ouverture du jour (ou depuis le premier point si pas de snapshot)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Trouver le premier point du jour (ouverture du jour)
  const todayFirstPoint = history.find((point) => (point.timestamp || 0) >= todayStart) || history[0];
  const lastPoint = history[history.length - 1];
  
  // Si pas de point du jour, utiliser le premier point disponible (IPO)
  const openingPoint = todayFirstPoint || history[0];
  
  // Calculer les probabilités selon la position
  const openingYes = openingPoint.yes || 0;
  const openingNo = openingPoint.no || 0;
  const openingTotal = openingYes + openingNo;
  const openingProbability = openingTotal > 0 
    ? (position === "yes" 
      ? (openingYes / openingTotal) * 100 
      : (openingNo / openingTotal) * 100)
    : 50;
  
  const lastYes = lastPoint.yes || 0;
  const lastNo = lastPoint.no || 0;
  const lastTotal = lastYes + lastNo;
  const lastProbability = lastTotal > 0 
    ? (position === "yes" 
      ? (lastYes / lastTotal) * 100 
      : (lastNo / lastTotal) * 100)
    : 50;
  
  // Calculer la variation de probabilité
  const probabilityVariation = lastProbability - openingProbability;
  const probabilityVariationPercent = openingProbability > 0 
    ? Math.round((probabilityVariation / openingProbability) * 100) 
    : 0;

  // Calculer la probabilité actuelle depuis current selon la position
  const currentYes = current.yes || 0;
  const currentNo = current.no || 0;
  const currentTotal = currentYes + currentNo;
  const currentProbability = currentTotal > 0 
    ? (position === "yes" 
      ? (currentYes / currentTotal) * 100 
      : (currentNo / currentTotal) * 100)
    : 50;

  if (compact) {
    return (
      <div className={cn("w-full", fullHeight ? "h-full" : "", !fullHeight && "min-h-[200px]")}>
        {chartOption ? (
          <ReactECharts
            option={chartOption}
            style={{ height: fullHeight ? "100%" : "200px", width: "100%" }}
            opts={{ renderer: "canvas", locale: "FR" }}
            notMerge={true}
            lazyUpdate={false}
          />
        ) : (
          <div className={cn("flex items-center justify-center text-muted-foreground text-xs", fullHeight ? "h-full" : "h-48")}>
            Chargement...
          </div>
        )}
      </div>
    );
  }

  // Mode desktop complet - Sans card, juste le graphique
  return (
    <div className={cn("w-full", fullHeight ? "h-full" : "h-[400px]")}>
          {chartOption ? (
            <ReactECharts
              option={chartOption}
          style={{ height: "100%", width: "100%" }}
              opts={{ 
                renderer: "canvas", 
                locale: "FR",
                devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 2,
            useDirtyRect: true,
              }}
              notMerge={true}
              lazyUpdate={false}
            />
          ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
              Chargement du graphique...
            </div>
          )}
    </div>
  );
}
