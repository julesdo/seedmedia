"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHashtagNode, $createHashtagNode, HashtagNode } from "../nodes/hashtag-node";
import { $getSelection, $isRangeSelection, TextNode, $createTextNode, LexicalNode } from "lexical";
import { useEffect } from "react";

export function HashtagPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode: TextNode) => {
      // Ignorer si le node est déjà un HashtagNode ou s'il est vide
      if ($isHashtagNode(textNode) || textNode.getTextContent().trim() === "") {
        return;
      }

      const textContent = textNode.getTextContent();
      // Regex pour détecter #tag (sans espace après le #)
      const hashtagRegex = /#(\w+)/g;
      let match;
      const matches: Array<{ start: number; end: number; tag: string }> = [];

      // Trouver tous les hashtags
      while ((match = hashtagRegex.exec(textContent)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          tag: match[1],
        });
      }

      if (matches.length === 0) return;

      // Vérifier si le curseur est dans un hashtag
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        if (anchorNode === textNode) {
          const anchorOffset = selection.anchor.offset;

          for (const match of matches) {
            if (anchorOffset >= match.start && anchorOffset <= match.end) {
              return; // Le curseur est dans un hashtag, ne pas transformer
            }
          }
        }
      }

      // Traiter seulement le premier hashtag, le transform se réexécutera pour les autres
      const firstMatch = matches[0];
      const beforeText = textContent.substring(0, firstMatch.start);
      const afterText = textContent.substring(firstMatch.end);
      
      // Créer les nodes nécessaires
      const hashtagNode = $createHashtagNode(firstMatch.tag);
      
      if (beforeText && afterText) {
        // Il y a du texte avant et après
        textNode.setTextContent(beforeText);
        textNode.insertAfter(hashtagNode);
        const afterTextNode = $createTextNode(afterText);
        hashtagNode.insertAfter(afterTextNode);
      } else if (beforeText) {
        // Il y a seulement du texte avant
        textNode.setTextContent(beforeText);
        textNode.insertAfter(hashtagNode);
      } else if (afterText) {
        // Il y a seulement du texte après
        textNode.replace(hashtagNode, false);
        const afterTextNode = $createTextNode(afterText);
        hashtagNode.insertAfter(afterTextNode);
      } else {
        // Le TextNode ne contient que le hashtag
        textNode.replace(hashtagNode, false);
      }
    });
  }, [editor]);

  return null;
}

