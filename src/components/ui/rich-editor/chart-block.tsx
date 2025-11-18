"use client"

import React from "react"
import { X } from "lucide-react"

import { Button } from "../button"
import { Card } from "../card"
import { TextNode } from "./types"
import { Chart } from "@/components/editor/editor-ui/chart"
import { ChartData } from "@/components/blocks/editor-00/nodes/chart-node"
import { useEditorDispatch } from "./store/editor-store"
import { EditorActions } from "./lib/reducer/actions"

interface ChartBlockProps {
  node: TextNode
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
}

export function ChartBlock({
  node,
  isActive,
  onClick,
  onDelete,
}: ChartBlockProps) {
  const dispatch = useEditorDispatch()

  // Récupérer les données du chart depuis les attributes
  const chartDataJson = node.attributes?.chartData as string | undefined
  let chartData: ChartData | null = null

  try {
    if (chartDataJson) {
      chartData = typeof chartDataJson === "string" 
        ? JSON.parse(chartDataJson) 
        : chartDataJson
    }
  } catch (error) {
    console.error("Error parsing chart data:", error)
  }

  // Si pas de données, créer un chart par défaut
  if (!chartData) {
    chartData = {
      type: "line",
      series: [
        {
          id: "series-1",
          name: "Série 1",
          color: "#246BFD",
          dataKey: "y1",
        },
      ],
      data: [
        { x: "Point 1", y1: 10 },
        { x: "Point 2", y1: 20 },
        { x: "Point 3", y1: 15 },
        { x: "Point 4", y1: 25 },
      ],
      layout: "full",
      height: 400,
    }
  }

  const handleEdit = (updatedData: ChartData) => {
    // Mettre à jour les attributes du node avec les nouvelles données
    dispatch(
      EditorActions.updateNode(node.id, {
        attributes: {
          ...node.attributes,
          chartData: JSON.stringify(updatedData),
        },
      })
    )
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    } else {
      dispatch(EditorActions.deleteNode(node.id))
    }
  }

  return (
    <div
      className={`group relative mb-4 transition-all duration-200 w-full max-w-full ${
        isActive ? "ring-primary/50 bg-accent/5 ring-2" : "hover:bg-accent/5"
      }`}
      onClick={onClick}
      style={{ maxHeight: "100%", overflow: "hidden" }}
    >
      {/* Delete button */}
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 z-30 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDelete()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Chart container */}
      <div className="relative w-full h-full" style={{ maxHeight: "100%", overflow: "hidden" }}>
        <Chart chartData={chartData} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}

