"use client"

import React from "react"
import { TextNode } from "./types"
import { LinkPreview } from "@/components/editor/editor-ui/link-preview"
import { useEditorDispatch } from "./store/editor-store"
import { EditorActions } from "./lib/reducer/actions"

interface LinkBlockProps {
  node: TextNode
  isActive: boolean
  onClick: () => void
  onDelete?: (nodeId?: string) => void
  readOnly?: boolean
}

export function LinkBlock({
  node,
  isActive,
  onClick,
  onDelete,
  readOnly = false,
}: LinkBlockProps) {
  // IMPORTANT: Tous les hooks doivent être appelés avant tout return conditionnel
  const dispatch = useEditorDispatch()

  // Extraire l'URL et le texte du lien
  const linkChild = node.children?.find((child) => child.href)
  const url = linkChild?.href || ""
  const text = linkChild?.content || url

  const handleDelete = () => {
    if (onDelete) {
      onDelete(node.id)
    } else {
      dispatch(EditorActions.deleteNode(node.id))
    }
  }

  // Si pas d'URL, retourner un placeholder caché au lieu de null pour maintenir le nombre de hooks
  if (!url) {
    return (
      <div
        data-node-id={node.id}
        data-link-block-empty="true"
        className="hidden"
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      data-node-id={node.id}
      className={`my-2 ${isActive ? "ring-2 ring-primary/50 rounded-lg" : ""}`}
      onClick={onClick}
    >
      <LinkPreview
        url={url}
        text={text}
        onDelete={readOnly ? undefined : handleDelete}
        className="w-full"
      />
    </div>
  )
}

