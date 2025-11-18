"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode, $isTextNode, $createTextNode, $getSelection, $isRangeSelection } from "lexical";
import { $createLinkPreviewNode, $isLinkPreviewNode } from "../nodes/link-node";
import { $createParagraphNode } from "lexical";

// Regex pour détecter les URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function AutoLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode: TextNode) => {
      // Ignorer si ce n'est pas un TextNode
      if (!$isTextNode(textNode)) {
        return;
      }

      const textContent = textNode.getTextContent();
      const matches = Array.from(textContent.matchAll(URL_REGEX));

      if (matches.length === 0) {
        return;
      }

      // Ne pas transformer si le node est déjà dans un lien
      const parent = textNode.getParent();
      if (parent) {
        const parentType = parent.getType();
        if (parentType === "link" || parentType === "link-preview") {
          return;
        }
      }

      // Ne pas transformer si le curseur est dans l'URL
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;
        
        if (anchorNode === textNode) {
          // Vérifier si le curseur est dans une URL détectée
          for (const match of matches) {
            const matchStart = match.index!;
            const matchEnd = matchStart + match[0].length;
            if (anchorOffset >= matchStart && anchorOffset <= matchEnd) {
              return; // Ne pas transformer si le curseur est dans l'URL
            }
          }
        }
      }

      // Traiter seulement la première URL trouvée
      const firstMatch = matches[0];
      if (!firstMatch) return;

      const url = firstMatch[0];
      const matchIndex = firstMatch.index!;
      const matchEnd = matchIndex + url.length;

      // Diviser le TextNode en trois parties : avant, URL, après
      const beforeText = textContent.substring(0, matchIndex);
      const afterText = textContent.substring(matchEnd);

      // Créer les nouveaux nodes
      const nodesToInsert: any[] = [];

      if (beforeText.trim()) {
        const beforeNode = $createTextNode(beforeText);
        nodesToInsert.push(beforeNode);
      }

      // Créer le LinkPreviewNode
      const linkPreviewNode = $createLinkPreviewNode(url);
      nodesToInsert.push(linkPreviewNode);

      if (afterText.trim()) {
        const afterNode = $createTextNode(afterText);
        nodesToInsert.push(afterNode);
      }

      // Remplacer le TextNode original
      if (nodesToInsert.length > 0) {
        textNode.replace(...nodesToInsert);
        
        // S'assurer qu'il y a un ParagraphNode après le link preview
        const nextSibling = linkPreviewNode.getNextSibling();
        if (!nextSibling || nextSibling.getType() !== "paragraph") {
          const paragraphAfter = $createParagraphNode();
          linkPreviewNode.insertAfter(paragraphAfter);
        }
      } else {
        textNode.remove();
      }
    });
  }, [editor]);

  return null;
}

