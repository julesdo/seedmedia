"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { ChartData, ChartType, ChartSeries, ChartDataPoint } from "@/components/blocks/editor-00/nodes/chart-node";
import { cn } from "@/lib/utils";

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "line", label: "Ligne" },
  { value: "bar", label: "Barres" },
  { value: "area", label: "Aires" },
  { value: "pie", label: "Camembert" },
  { value: "scatter", label: "Nuage de points" },
];

const DEFAULT_COLORS = [
  "#246BFD",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

interface ChartEditorProps {
  chartData: ChartData;
  onSave: (data: ChartData) => void;
  onCancel: () => void;
}

export function ChartEditor({ chartData, onSave, onCancel }: ChartEditorProps) {
  const [type, setType] = useState<ChartType>(chartData.type);
  const [title, setTitle] = useState(chartData.title || "");
  const [series, setSeries] = useState<ChartSeries[]>(chartData.series);
  const [data, setData] = useState<ChartDataPoint[]>(chartData.data);
  const [isSeriesOpen, setIsSeriesOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(true);

  // Synchroniser avec les props si elles changent de l'extérieur
  useEffect(() => {
    if (chartData.type !== type) setType(chartData.type);
    if (chartData.title !== title) setTitle(chartData.title || "");
    // Comparaison profonde pour series et data
    const seriesChanged = JSON.stringify(chartData.series) !== JSON.stringify(series);
    const dataChanged = JSON.stringify(chartData.data) !== JSON.stringify(data);
    if (seriesChanged) setSeries(chartData.series);
    if (dataChanged) setData(chartData.data);
  }, [chartData]);

  const addSeries = () => {
    const newSeriesId = `series-${Date.now()}`;
    const newDataKey = `y${series.length + 1}`;
    const colorIndex = series.length % DEFAULT_COLORS.length;
    
    const newSeries: ChartSeries = {
      id: newSeriesId,
      name: `Série ${series.length + 1}`,
      color: DEFAULT_COLORS[colorIndex],
      dataKey: newDataKey,
    };

    const updatedData = data.map((point) => ({
      ...point,
      [newDataKey]: 0,
    }));

    setSeries([...series, newSeries]);
    setData(updatedData);
  };

  const removeSeries = (seriesId: string) => {
    if (series.length <= 1) return;
    
    const seriesToRemove = series.find((s) => s.id === seriesId);
    if (!seriesToRemove) return;

    const updatedSeries = series.filter((s) => s.id !== seriesId);
    const updatedData = data.map((point) => {
      const { [seriesToRemove.dataKey]: _, ...rest } = point;
      return rest;
    });

    setSeries(updatedSeries);
    setData(updatedData);
  };

  const updateSeries = (seriesId: string, updates: Partial<ChartSeries>) => {
    setSeries(series.map((s) => (s.id === seriesId ? { ...s, ...updates } : s)));
  };

  const addDataRow = () => {
    const newRow: ChartDataPoint = {
      x: `Point ${data.length + 1}`,
    };
    series.forEach((s) => {
      newRow[s.dataKey] = 0;
    });
    setData([...data, newRow]);
  };

  const removeDataRow = (index: number) => {
    if (data.length <= 1) return;
    setData(data.filter((_, i) => i !== index));
  };

  const updateDataCell = (rowIndex: number, key: string, value: string | number) => {
    const updatedData = [...data];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [key]: value,
    };
    setData(updatedData);
  };

  // Sauvegarde automatique avec debounce pour éviter trop de re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const updatedChartData: ChartData = {
        type,
        title: title.trim() || undefined,
        series,
        data,
      };
      onSave(updatedChartData);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [type, title, series, data, onSave]);

  return (
    <div className="space-y-3">
      {/* Configuration rapide */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="chart-title" className="text-xs font-medium text-foreground">
            Titre
          </Label>
          <Input
            id="chart-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du graphique"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chart-type" className="text-xs font-medium text-foreground">
            Type
          </Label>
          <Select value={type} onValueChange={(value: ChartType) => setType(value)}>
            <SelectTrigger id="chart-type" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Séries */}
      <Collapsible open={isSeriesOpen} onOpenChange={setIsSeriesOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-background/40 p-2 hover:bg-background/50 transition-colors">
          <span className="text-xs font-medium text-foreground">Séries ({series.length})</span>
          <SolarIcon 
            icon={isSeriesOpen ? "alt-arrow-up-bold" : "alt-arrow-down-bold"} 
            className="h-3 w-3 text-muted-foreground"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {series.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-lg bg-background/30 p-2 border border-border/10 hover:bg-background/40 transition-colors group/series"
            >
              <div className="relative">
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => updateSeries(s.id, { color: e.target.value })}
                  className="h-7 w-7 rounded border border-border/30 cursor-pointer appearance-none bg-transparent hover:ring-1 hover:ring-primary/30 transition-all"
                  style={{ 
                    backgroundColor: s.color,
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                  title="Changer la couleur"
                />
              </div>
              <Input
                value={s.name}
                onChange={(e) => updateSeries(s.id, { name: e.target.value })}
                placeholder="Nom de la série"
                className="flex-1 h-7 text-xs"
              />
              {series.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSeries(s.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive opacity-0 group-hover/series:opacity-100 transition-opacity"
                >
                  <SolarIcon icon="trash-bin-trash-bold" className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={addSeries}
            className="w-full h-7 text-xs"
          >
            <SolarIcon icon="add-circle-bold" className="h-3 w-3 mr-1.5" />
            Ajouter une série
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Données */}
      <Collapsible open={isDataOpen} onOpenChange={setIsDataOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-background/40 p-2 hover:bg-background/50 transition-colors">
          <span className="text-xs font-medium text-foreground">Données ({data.length} lignes)</span>
          <SolarIcon 
            icon={isDataOpen ? "alt-arrow-up-bold" : "alt-arrow-down-bold"} 
            className="h-3 w-3 text-muted-foreground"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="rounded-lg border border-border/20 overflow-hidden">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/20">
                    <th className="text-left p-2 font-semibold text-foreground sticky left-0 bg-background/80 z-20">
                      X
                    </th>
                    {series.map((s) => (
                      <th
                        key={s.id}
                        className="text-left p-2 font-semibold text-foreground min-w-[100px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="truncate">{s.name}</span>
                        </div>
                      </th>
                    ))}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="border-b border-border/10 hover:bg-background/30 transition-colors group/row"
                    >
                      <td className="p-1.5 sticky left-0 bg-background/95 group-hover/row:bg-background/30 z-10">
                        <Input
                          value={row.x}
                          onChange={(e) =>
                            updateDataCell(rowIndex, "x", e.target.value)
                          }
                          className="h-7 text-xs"
                          placeholder="X"
                        />
                      </td>
                      {series.map((s) => (
                        <td key={s.id} className="p-1.5">
                          <Input
                            type="number"
                            step="any"
                            value={row[s.dataKey] || ""}
                            onChange={(e) =>
                              updateDataCell(
                                rowIndex,
                                s.dataKey,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-7 text-xs"
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="p-1.5">
                        {data.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDataRow(rowIndex)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity"
                          >
                            <SolarIcon icon="trash-bin-trash-bold" className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/20 p-2 bg-background/30">
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={addDataRow}
                className="w-full h-7 text-xs"
              >
                <SolarIcon icon="add-circle-bold" className="h-3 w-3 mr-1.5" />
                Ajouter une ligne
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sauvegarde automatique - pas de boutons nécessaires */}
    </div>
  );
}

