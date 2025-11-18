"use client"

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState, SerializedEditorState } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

interface EditorProps {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  placeholder?: string
  autoFocus?: boolean
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  placeholder,
  autoFocus = false,
}: EditorProps) {
  return (
    <LexicalComposer
      initialConfig={{
        ...editorConfig,
        ...(editorState ? { editorState } : {}),
        ...(editorSerializedState
          ? { editorState: JSON.stringify(editorSerializedState) }
          : {}),
      }}
    >
      <TooltipProvider>
        <Plugins placeholder={placeholder} autoFocus={autoFocus} />

        <OnChangePlugin
          ignoreSelectionChange={true}
          onChange={(editorState) => {
            onChange?.(editorState)
            onSerializedChange?.(editorState.toJSON())
          }}
        />
      </TooltipProvider>
    </LexicalComposer>
  )
}
