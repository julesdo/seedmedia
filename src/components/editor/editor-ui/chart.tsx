"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { ChartEditor } from "./chart-editor";
import { ChartData, ChartType, BlockLayout } from "@/components/blocks/editor-00/nodes/chart-node";
import { motion, AnimatePresence } from "motion/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartProps {
  chartData: ChartData;
  onEdit: (data: ChartData) => void;
  onDelete: () => void;
}

export function Chart({ chartData, onEdit, onDelete }: ChartProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [localChartData, setLocalChartData] = useState<ChartData>({
    ...chartData,
    layout: chartData.layout || "full", // Par défaut pleine largeur (1/1)
    height: chartData.height || 400, // Par défaut 400px
  });
  
  // Ref pour accéder à la valeur actuelle sans dépendre de localChartData dans useCallback
  const localChartDataRef = useRef(localChartData);
  useEffect(() => {
    localChartDataRef.current = localChartData;
  }, [localChartData]);

  // Mémoriser la config du graphique pour éviter les recalculs
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    localChartData.series.forEach((series) => {
      config[series.dataKey] = {
        label: series.name,
        color: series.color,
      };
    });
    return config;
  }, [localChartData.series]);

  // Callback optimisé pour les mises à jour
  const handleChartDataUpdate = useCallback((updatedData: ChartData) => {
    // Préserver layout et height lors des mises à jour depuis l'éditeur
    const updated = {
      ...updatedData,
      layout: localChartData.layout || updatedData.layout || "full",
      height: localChartData.height || updatedData.height,
    };
    setLocalChartData(updated);
    // Sauvegarder avec un léger délai pour éviter les re-renders trop fréquents
    onEdit(updated);
  }, [onEdit, localChartData.layout, localChartData.height]);

  // Synchroniser avec les props si elles changent de l'extérieur (seulement si vraiment différent)
  useEffect(() => {
    const currentStr = JSON.stringify(localChartData);
    const newStr = JSON.stringify(chartData);
    if (currentStr !== newStr) {
      setLocalChartData(chartData);
    }
  }, [chartData]);

  // Mémoriser le rendu du graphique pour éviter les re-renders inutiles
  const renderChart = useMemo((): React.ReactElement => {
    const chartHeight = localChartData.height || 400;
    // Ajuster les marges selon la taille du graphique
    const margin = chartHeight < 200 
      ? { top: 5, right: 10, left: 5, bottom: 5 }
      : { top: 10, right: 15, left: 10, bottom: 10 };
    
    const commonProps = {
      data: localChartData.data,
      margin,
    };

    switch (localChartData.type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {localChartData.series.map((series) => (
              <Line
                key={series.id}
                type="monotone"
                dataKey={series.dataKey}
                stroke={series.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {localChartData.series.map((series) => (
              <Bar
                key={series.id}
                dataKey={series.dataKey}
                fill={series.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {localChartData.series.map((series) => (
              <Area
                key={series.id}
                type="monotone"
                dataKey={series.dataKey}
                stroke={series.color}
                fill={series.color}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        const pieData = localChartData.data.map((point) => ({
          name: String(point.x),
          value: Number(point[localChartData.series[0]?.dataKey] || 0),
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartData.series[index % chartData.series.length]?.color || "#8884d8"}
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        );

      case "scatter":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" />
            <YAxis type="number" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {localChartData.series.map((series) => (
              <Line
                key={series.id}
                type="monotone"
                dataKey={series.dataKey}
                stroke={series.color}
                strokeWidth={2}
                dot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        );
    }
  }, [localChartData]);

  // Gestion du redimensionnement vertical uniquement
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'vertical') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Utiliser la ref pour obtenir la valeur actuelle
    const current = localChartDataRef.current;
    const currentHeight = current.height || 200;
    
    const startY = e.clientY;
    const startHeight = currentHeight;
    
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaY = e.clientY - startY;
      
      // Snap vertical par pas de 25px pour un alignement propre
      const snapStep = 25;
      const rawHeight = startHeight + deltaY;
      // Snap sur le pas le plus proche
      let newHeight = Math.round(rawHeight / snapStep) * snapStep;
      // S'assurer qu'on reste dans les limites
      newHeight = Math.max(150, Math.min(600, newHeight));
      
      // Toujours mettre à jour pour forcer le re-render
      setLocalChartData(prev => {
        // Ne mettre à jour que si la valeur a vraiment changé
        if (prev.height === newHeight) {
          return prev; // Pas de changement, éviter le re-render inutile
        }
        
        const updated = {
          ...prev,
          height: newHeight,
        };
        
        // Mettre à jour le nœud Lexical en temps réel pour forcer le re-render
        onEdit(updated);
        
        return updated;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // La sauvegarde est déjà faite dans handleMouseMove, pas besoin de refaire ici
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onEdit]); // Retirer localChartData des dépendances pour éviter les re-créations

  const chartLayout = localChartData.layout || "full";
  const chartHeight = localChartData.height || 400;

  return (
    <div 
      key={`chart-${chartLayout}-${chartHeight}`}
      className="my-4 group/chart relative w-full h-full"
      data-lexical-chart
      data-layout={chartLayout}
      style={{
        height: "100%",
        minHeight: `${chartHeight}px`,
        maxHeight: "100%",
        overflow: "hidden",
      }}
    >
      <Card className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg overflow-hidden relative h-full flex flex-col">
        {/* Header compact */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/10 shrink-0">
          <div className="flex items-center gap-2">
            {localChartData.title && (
              <span className="text-xs font-semibold text-gradient-light">
                {localChartData.title}
              </span>
            )}
            <span className="text-xs text-muted-foreground/70">
              {localChartData.type}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={cn(
                "h-6 opacity-0 group-hover/chart:opacity-100 transition-opacity",
                isConfigOpen && "opacity-100 bg-primary/20 text-primary"
              )}
              title={isConfigOpen ? "Fermer la configuration" : "Ouvrir la configuration"}
            >
              <SolarIcon icon={isConfigOpen ? "close-circle-bold" : "settings-bold"} className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={onDelete}
              className="h-6 opacity-0 group-hover/chart:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30"
              title="Supprimer le graphique"
            >
              <SolarIcon icon="trash-bin-trash-bold" className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Layout en deux colonnes */}
        <div className="flex flex-col lg:flex-row gap-4 h-full max-h-full overflow-hidden flex-1 min-h-0">
          {/* Colonne graphique */}
          <motion.div
            className={cn(
              "flex-1 min-w-0 h-full",
              isConfigOpen ? "lg:w-2/3" : "w-full"
            )}
            layout
            transition={{
              layout: {
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              },
            }}
            style={{ maxHeight: "100%", overflow: "hidden" }}
          >
            <CardContent className="p-2 h-full">
              <div 
                className="h-full w-full"
                style={{ 
                  height: "100%",
                  minHeight: `${chartHeight}px`,
                  maxHeight: "100%"
                }}
              >
                <ChartContainer config={chartConfig} className="h-full w-full">
                  {renderChart}
                </ChartContainer>
              </div>
            </CardContent>
          </motion.div>

          {/* Colonne configuration */}
          <AnimatePresence>
            {isConfigOpen && (
              <motion.div
                className="lg:w-1/3 lg:border-l lg:border-t border-border/10 pt-4 lg:pt-0 h-full max-h-full flex flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div className="px-4 pb-4 h-full overflow-y-auto overflow-x-hidden">
                  <ChartEditor
                    chartData={localChartData}
                    onSave={handleChartDataUpdate}
                    onCancel={() => {}} // Pas besoin de cancel dans le mode inline
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Poignée de redimensionnement vertical uniquement */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover/chart:opacity-100 transition-opacity hover:bg-primary/20 z-20"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e, 'vertical');
          }}
          title="Redimensionner verticalement"
        />
      </Card>
    </div>
  );
}
