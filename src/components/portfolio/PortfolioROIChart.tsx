"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { YES_COLORS } from "@/lib/colors";

/**
 * 🎯 Graphique d'évolution du ROI du portefeuille dans le temps
 * Affiche l'évolution du profit/perte total et du ROI en pourcentage
 */
export function PortfolioROIChart() {
  const { theme } = useTheme();

  // Récupérer l'historique du ROI (on va créer cette query)
  const roiHistory = useQuery(api.trading.getPortfolioROIHistory, {});

  // Préparer les données pour ECharts
  const chartOption = useMemo(() => {
    const isDark = typeof window !== "undefined" && (
      theme === "dark" || 
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      document.documentElement.classList.contains("dark")
    );

    if (!roiHistory || roiHistory.length === 0) {
      return {
        backgroundColor: "transparent",
        textStyle: {
          color: isDark ? "#E6EDF3" : "#0B1320",
        },
        grid: {
          left: "10%",
          right: "10%",
          top: "15%",
          bottom: "15%",
        },
        xAxis: {
          type: "time",
          boundaryGap: false,
        },
        yAxis: {
          type: "value",
        },
        series: [],
      };
    }

    // Formater les données pour ECharts
    const roiData: [number, number][] = [];

    roiHistory.forEach((point) => {
      const timestamp = point.timestamp;
      const roiValue = point.roiPercent || 0;
      
      // S'assurer que le timestamp est valide
      if (timestamp && !isNaN(timestamp) && timestamp > 0) {
        roiData.push([timestamp, roiValue]);
      }
    });

    // Trier par timestamp
    roiData.sort((a, b) => a[0] - b[0]);

    // Debug: afficher les données dans la console
    console.log("PortfolioROIChart - Data points:", {
      count: roiData.length,
      first: roiData[0],
      last: roiData[roiData.length - 1],
      all: roiData,
    });

    const primaryColor = YES_COLORS.chart.light;
    const profitColor = YES_COLORS.chart.light;
    const lossColor = "#9CA3AF"; // Gris neutre pour les pertes

    return {
      backgroundColor: "transparent",
      textStyle: {
        color: isDark ? "#E6EDF3" : "#0B1320",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        left: "12%",
        right: "8%",
        top: "20%",
        bottom: "15%",
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "rgba(17, 21, 31, 0.95)" : "rgba(255, 255, 255, 0.95)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        textStyle: {
          color: isDark ? "#E6EDF3" : "#0B1320",
          fontFamily: "var(--font-mono)",
        },
        formatter: (params: any) => {
          const date = new Date(params[0].value[0]);
          const dateStr = date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          });
          const roiValue = params[0].value[1];
          const profitValue = params[1]?.value[1] || 0;
          return `
            <div style="padding: 8px;">
              <div style="margin-bottom: 4px; font-weight: 600;">${dateStr}</div>
              <div style="color: ${primaryColor};">ROI: ${roiValue > 0 ? "+" : ""}${roiValue.toFixed(2)}%</div>
              <div style="color: ${profitValue >= 0 ? profitColor : lossColor};">P&L: ${profitValue > 0 ? "+" : ""}${profitValue.toFixed(2)}</div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
      },
      xAxis: {
        type: "time",
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          },
        },
        axisLabel: {
          color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          formatter: (value: number) => {
            const date = new Date(value);
            return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: [
        {
          type: "value",
          name: "ROI (%)",
          position: "left",
          axisLine: {
            lineStyle: {
              color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            },
          },
          axisLabel: {
            color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            formatter: (value: number) => {
              return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
            },
          },
          splitLine: {
            lineStyle: {
              color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            },
          },
        },
      ],
      series: [
        {
          name: "ROI (%)",
          type: "line",
          data: roiData,
          smooth: true,
          symbol: "none",
          lineStyle: {
            color: primaryColor,
            width: 2,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: YES_COLORS.chart.gradient.start,
                },
                {
                  offset: 0.5,
                  color: "rgba(36, 107, 253, 0.15)",
                },
                {
                  offset: 1,
                  color: YES_COLORS.chart.gradient.end,
                },
              ],
            },
          },
          lineStyle: {
            width: 2.5,
            shadowBlur: 4,
            shadowColor: isDark ? "rgba(36, 107, 253, 0.3)" : "rgba(36, 107, 253, 0.2)",
          },
          emphasis: {
            focus: "series",
          },
        },
      ],
    };
  }, [roiHistory, theme]);

  if (!roiHistory) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (roiHistory.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Pattern en arrière-plan */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Dégradé bleu fin */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/2 to-transparent z-10" />
      
      {/* Contenu */}
      <div className="relative p-5 lg:p-6 bg-card/60 backdrop-blur-sm rounded-2xl z-20">
        <div className="mb-4">
          <h3 className="text-base lg:text-lg font-semibold mb-1">Évolution du ROI</h3>
          <p className="text-xs text-muted-foreground">
            Retour sur investissement dans le temps
          </p>
        </div>
        
        <div className="h-64 lg:h-80">
          <ReactECharts
            option={chartOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ 
              renderer: "canvas",
              devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 2,
              useDirtyRect: true,
            }}
            onChartReady={(chart) => {
              // Optimisations mobile
              if (typeof window !== "undefined" && "ontouchstart" in window) {
                chart.getZr().on("touchstart", () => {
                  chart.getZr().setCursorStyle("move");
                });
                chart.getZr().on("touchend", () => {
                  chart.getZr().setCursorStyle("default");
                });
              }
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

