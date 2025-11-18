import { useState, useEffect } from "react"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { Toolbar } from "@/components/editor/editor-ui/toolbar"
import { HashtagPlugin } from "./plugins/hashtag-plugin"
import { CustomLinkPlugin } from "./plugins/link-plugin"
import { DecoratorPlugin } from "./plugins/decorator-plugin"
import { AutoLinkPlugin } from "./plugins/auto-link-plugin"

interface PluginsProps {
  placeholder?: string
  autoFocus?: boolean
}

function AutoFocusPlugin({ autoFocus }: { autoFocus: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (autoFocus) {
      // Attendre que l'éditeur soit prêt
      setTimeout(() => {
        editor.focus()
      }, 100)
    }
  }, [autoFocus, editor])

  return null
}

export function Plugins({ placeholder, autoFocus = false }: PluginsProps) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <div className="relative border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg rounded-lg overflow-hidden flex flex-col" style={{ height: "500px" }}>
      {/* Toolbar - Sticky */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-border/20">
        <Toolbar />
      </div>
      
      {/* Editor content - Scrollable */}
      <div className="relative flex-1 overflow-hidden min-h-0 bg-background/80 dark:bg-background/60">
        <RichTextPlugin
          contentEditable={
            <div className="h-full overflow-y-auto bg-background/80 dark:bg-background/60">
              <div ref={onRef} className="h-full bg-background/80 dark:bg-background/60">
                <ContentEditable
                  placeholder={placeholder ?? "Commencez à écrire..."}
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <HistoryPlugin />
        <HashtagPlugin />
        <CustomLinkPlugin />
        <AutoLinkPlugin />
        <DecoratorPlugin />
        <AutoFocusPlugin autoFocus={autoFocus} />
      </div>
    </div>
  )
}
