"use client";

import { useMemo, useEffect, useState, memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SolarIcon } from "@/components/icons/SolarIcon";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";
import { YES_COLORS } from "@/lib/colors";

interface MobileChartProps {
  decisionId: Id<"decisions">;
}

/**
 * Graphique dédié au mobile - Compact, interactif et optimisé tactile
 */
export const MobileChart = memo(function MobileChart({ decisionId }: MobileChartProps) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, { decisionId });
  const probability = useQuery(api.trading.getSingleOdds, { decisionId });

  const chartOption = useMemo(() => {
    const isDark = typeof window !== "undefined" && (
      theme === "dark" || 
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      document.documentElement.classList.contains("dark")
    );

    if (!courseHistory || courseHistory.history.length === 0) {
      return null;
    }

    const { history } = courseHistory;
    const probabilityData: [number, number][] = [];

    history.forEach((point) => {
      const timestamp = point.timestamp || (typeof point.time === 'number' && point.time > 0
        ? point.time * 1000
        : Date.now());

      const yesLiquidity = point.yes || 0;
      const noLiquidity = point.no || 0;
      const totalLiquidity = yesLiquidity + noLiquidity;
      
      // Toujours afficher la probabilité OUI
      const prob = totalLiquidity > 0 
        ? (yesLiquidity / totalLiquidity) * 100
        : 50;

      if (!isNaN(Number(prob)) && Number(prob) >= 0 && Number(prob) <= 100) {
        probabilityData.push([timestamp, Number(prob)]);
      }
    });

    probabilityData.sort((a, b) => a[0] - b[0]);

    const currentProb = probabilityData.length > 0 ? probabilityData[probabilityData.length - 1][1] : 50;
    // Utiliser la couleur bleue primaire pour OUI (hexadécimal pour ECharts)
    const color = YES_COLORS.chart.light; // #246BFD - Bleu primaire
    const bgColor = isDark ? "rgba(36, 107, 253, 0.15)" : "rgba(36, 107, 253, 0.1)";

    return {
      backgroundColor: "transparent",
      grid: {
        left: "8%",
        right: "8%",
        top: "15%",
        bottom: "20%",
        containLabel: false,
      },
      xAxis: {
        type: "time",
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
          fontSize: 10,
          formatter: (value: number) => {
            const date = new Date(value);
            const now = new Date();
            const diff = now.getTime() - value;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours < 1) return "Maintenant";
            if (hours < 24) return `${hours}h`;
            const days = Math.floor(hours / 24);
            return `${days}j`;
          },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        boundaryGap: ["10%", "10%"],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
          fontSize: 10,
          formatter: "{value}%",
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            type: "dashed",
          },
        },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.95)",
        borderColor: color,
        borderWidth: 1,
        textStyle: {
          color: isDark ? "#fff" : "#000",
          fontSize: 11,
        },
        formatter: (params: any) => {
          const point = params[0];
          const date = new Date(point.value[0]);
          const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          return `${time}<br/>${point.value[1].toFixed(1)}%`;
        },
        axisPointer: {
          type: "line",
          lineStyle: {
            color: color,
            width: 1,
            type: "dashed",
          },
        },
      },
      series: [
        {
          name: "OUI",
          type: "line",
          data: probabilityData,
          smooth: true,
          symbol: "none",
          lineStyle: {
            color: color,
            width: 3,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: bgColor },
                { offset: 1, color: "transparent" },
              ],
            },
          },
          emphasis: {
            focus: "series",
            lineStyle: {
              width: 4,
            },
          },
          markPoint: probabilityData.length > 0 ? {
            data: [
              {
                coord: [probabilityData[probabilityData.length - 1][0], currentProb],
                symbol: "circle",
                symbolSize: 8,
                itemStyle: {
                  color: color,
                  borderColor: isDark ? "#fff" : "#000",
                  borderWidth: 2,
                },
              },
            ],
          } : undefined,
        },
      ],
      animation: !isMobile, // Désactiver animations sur mobile pour performance
      animationDuration: isMobile ? 0 : 750,
    };
  }, [courseHistory, theme, isMobile]);

  return (
    <div className="w-full">

      {/* Graphique */}
      <div className="h-[280px] w-full rounded-lg border border-border/30 bg-card/30 p-2">
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
            <div className="flex flex-col items-center gap-2">
              <SolarIcon icon="loading" className="size-5 animate-spin" />
              <span className="text-xs">Chargement...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

