"use client"

import React from "react"
import { X } from "lucide-react"

import { Button } from "../button"
import { TextNode } from "./types"
import { CodeEditor } from "@/components/editor/editor-ui/code-editor"
import { useEditorDispatch } from "./store/editor-store"
import { EditorActions } from "./lib/reducer/actions"

interface CodeBlockProps {
  node: TextNode
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
}

export interface CodeBlockData {
  code: string
  language: string
  mode: "split" | "full" // split = code + preview, full = preview only
}

export function CodeBlock({
  node,
  isActive,
  onClick,
  onDelete,
}: CodeBlockProps) {
  const dispatch = useEditorDispatch()

  // Récupérer les données du code depuis les attributes
  const codeDataJson = node.attributes?.codeData as string | undefined
  let codeData: CodeBlockData | null = null

  try {
    if (codeDataJson) {
      codeData = typeof codeDataJson === "string" 
        ? JSON.parse(codeDataJson) 
        : codeDataJson
    }
  } catch (error) {
    console.error("Error parsing code data:", error)
  }

  // Si pas de données, créer un bloc code par défaut
  if (!codeData) {
    // Essayer de récupérer le code depuis le contenu du node
    const nodeContent = node.content || ""
    codeData = {
      code: nodeContent,
      language: "javascript",
      mode: "split",
    }
  }

  const handleEdit = (updatedData: CodeBlockData) => {
    // Mettre à jour les attributes du node avec les nouvelles données
    dispatch(
      EditorActions.updateNode(node.id, {
        attributes: {
          ...node.attributes,
          codeData: JSON.stringify(updatedData),
        },
        content: updatedData.code, // Garder aussi le contenu pour compatibilité
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

      {/* Code container */}
      <div className="relative w-full h-full" style={{ maxHeight: "100%", overflow: "hidden" }}>
        <CodeEditor codeData={codeData} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}

