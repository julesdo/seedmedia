"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHashtagNode, HashtagNode } from "../nodes/hashtag-node";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

function HashtagComponent({ nodeKey, tag }: { nodeKey: string; tag: string }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          if (target.closest(`[data-lexical-hashtag="${tag}"]`)) {
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, isSelected, setSelected, clearSelection, tag]);

  return (
    <Badge
      data-lexical-hashtag={tag}
      variant="default"
      className={isSelected ? "ring-2 ring-primary" : "cursor-pointer"}
    >
      #{tag}
    </Badge>
  );
}

export function DecoratorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerDecoratorListener((decorator) => {
      // Le rendu des DecoratorNodes est géré automatiquement par Lexical
      // via la méthode decorate() de chaque node
    });
  }, [editor]);

  return null;
}

// Export pour utilisation dans les nodes
export { HashtagComponent };

