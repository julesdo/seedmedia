"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChartData, ChartType, ChartSeries, ChartDataPoint } from "@/components/blocks/editor-00/nodes/chart-node";

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

interface ChartInsertDialogProps {
  onInsert: (chartData: ChartData) => void;
}

export function ChartInsertDialog({ onInsert }: ChartInsertDialogProps) {
  const [open, setOpen] = useState(false);

  const handleInsert = () => {
    // Créer un graphique par défaut
    const defaultSeries: ChartSeries = {
      id: "series-1",
      name: "Série 1",
      color: DEFAULT_COLORS[0],
      dataKey: "y1",
    };

    const defaultData: ChartDataPoint[] = [
      { x: "Point 1", y1: 10 },
      { x: "Point 2", y1: 20 },
      { x: "Point 3", y1: 15 },
      { x: "Point 4", y1: 25 },
    ];

    const chartData: ChartData = {
      type: "line",
      series: [defaultSeries],
      data: defaultData,
      layout: "full", // Par défaut pleine largeur
      height: 200,
    };

    onInsert(chartData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="glass"
          size="sm"
          className="h-8 w-8 p-0"
          title="Insérer un graphique"
        >
          <span className="text-sm">📊</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-gradient-light">Insérer un graphique</DialogTitle>
          <DialogDescription>
            Un graphique par défaut sera créé. Vous pourrez le modifier ensuite.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" variant="glass" onClick={handleInsert}>
            Insérer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

