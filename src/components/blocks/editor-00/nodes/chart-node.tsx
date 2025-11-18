"use client";

import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $getNodeByKey,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Chart } from "@/components/editor/editor-ui/chart";

export type ChartType = "line" | "bar" | "area" | "pie" | "scatter";

export interface ChartDataPoint {
  x: string | number;
  [key: string]: string | number; // y values for each series
}

export interface ChartSeries {
  id: string;
  name: string;
  color: string;
  dataKey: string;
}

export type BlockLayout = "full" | "half"; // 1/1 (pleine largeur) ou 1/2 (moitié)

export interface ChartData {
  type: ChartType;
  series: ChartSeries[];
  data: ChartDataPoint[];
  title?: string;
  layout?: BlockLayout; // Layout prédéfini : "full" (1/1) ou "half" (1/2)
  height?: number; // Hauteur en pixels
}

export type SerializedChartNode = Spread<
  {
    chartData: ChartData;
  },
  SerializedLexicalNode
>;

export class ChartNode extends DecoratorNode<JSX.Element> {
  __chartData: ChartData;

  static getType(): string {
    return "chart";
  }

  static clone(node: ChartNode): ChartNode {
    return new ChartNode(node.__chartData, node.__key);
  }

  constructor(chartData: ChartData, key?: NodeKey) {
    super(key);
    this.__chartData = chartData;
  }

  getType(): string {
    return "chart";
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedChartNode): ChartNode {
    const { chartData } = serializedNode;
    return new ChartNode(chartData);
  }

  exportJSON(): SerializedChartNode {
    return {
      chartData: this.__chartData,
      type: "chart",
      version: 1,
    };
  }

  getChartData(): ChartData {
    return this.__chartData;
  }

  setChartData(chartData: ChartData): void {
    const writable = this.getWritable();
    writable.__chartData = chartData;
  }

  decorate(): JSX.Element {
    return <ChartComponent nodeKey={this.__key} chartData={this.__chartData} />;
  }

  isInline(): boolean {
    return false; // Les graphiques sont des blocs
  }
}

export function $createChartNode(chartData: ChartData): ChartNode {
  return new ChartNode(chartData);
}

export function $isChartNode(
  node: LexicalNode | null | undefined
): node is ChartNode {
  return node instanceof ChartNode;
}

// Composant React pour le rendu avec fonctionnalité d'édition
function ChartComponent({ nodeKey, chartData }: { nodeKey: string; chartData: ChartData }) {
  const [editor] = useLexicalComposerContext();

  const handleEdit = (updatedData: ChartData) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isChartNode(node)) {
        node.setChartData(updatedData);
      }
    });
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isChartNode(node)) {
        node.remove();
      }
    });
  };

  return <Chart chartData={chartData} onEdit={handleEdit} onDelete={handleDelete} />;
}

