"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { $createLinkNode } from "@lexical/link";
import { $createHashtagNode } from "@/components/blocks/editor-00/nodes/hashtag-node";
import { $createLinkPreviewNode } from "@/components/blocks/editor-00/nodes/link-node";
import { $createChartNode, ChartData } from "@/components/blocks/editor-00/nodes/chart-node";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { LinkDialog } from "./link-dialog";
import { ChartInsertDialog } from "./chart-insert-dialog";

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const formatList = (listType: "bullet" | "number") => {
    if (listType === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertHashtag = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Insérer simplement un #, le plugin le transformera automatiquement
        selection.insertText("#");
      }
    });
  };

  const insertLink = (url: string, text: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Utiliser LinkPreviewNode pour afficher une carte de prévisualisation
        const linkPreviewNode = $createLinkPreviewNode(url, text || undefined);
        selection.insertNodes([linkPreviewNode]);
        
        // S'assurer qu'il y a toujours un ParagraphNode avant ET après pour permettre l'écriture
        const previousSibling = linkPreviewNode.getPreviousSibling();
        if (!previousSibling || previousSibling.getType() !== "paragraph") {
          const paragraphBefore = $createParagraphNode();
          linkPreviewNode.insertBefore(paragraphBefore);
        }
        
        const nextSibling = linkPreviewNode.getNextSibling();
        if (!nextSibling || nextSibling.getType() !== "paragraph") {
          const paragraphAfter = $createParagraphNode();
          linkPreviewNode.insertAfter(paragraphAfter);
        }
      }
    });
  };

  const insertChart = (chartData: ChartData) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const chartNode = $createChartNode(chartData);
        selection.insertNodes([chartNode]);
        
        // S'assurer qu'il y a toujours un ParagraphNode après pour permettre l'écriture
        const nextSibling = chartNode.getNextSibling();
        if (!nextSibling || nextSibling.getType() !== "paragraph") {
          const paragraphAfter = $createParagraphNode();
          chartNode.insertAfter(paragraphAfter);
        }
      }
    });
  };

  return (
    <div className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg rounded-t-lg border-b border-border/20 p-2 flex items-center gap-1 flex-wrap min-h-[48px]">
      {/* Format de texte */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatText("bold")}
          className={cn(
            "h-8 w-8 p-0 font-bold",
            isBold && "bg-primary/20 text-primary ring-1 ring-primary/30"
          )}
          title="Gras (Ctrl+B)"
        >
          B
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatText("italic")}
          className={cn(
            "h-8 w-8 p-0 italic",
            isItalic && "bg-primary/20 text-primary ring-1 ring-primary/30"
          )}
          title="Italique (Ctrl+I)"
        >
          I
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatText("underline")}
          className={cn(
            "h-8 w-8 p-0 underline",
            isUnderline && "bg-primary/20 text-primary ring-1 ring-primary/30"
          )}
          title="Souligné (Ctrl+U)"
        >
          U
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatText("strikethrough")}
          className={cn(
            "h-8 w-8 p-0 line-through",
            isStrikethrough && "bg-primary/20 text-primary ring-1 ring-primary/30"
          )}
          title="Barré"
        >
          S
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatText("code")}
          className={cn(
            "h-8 w-8 p-0 text-xs font-mono",
            isCode && "bg-primary/20 text-primary ring-1 ring-primary/30"
          )}
          title="Code"
        >
          &lt;/&gt;
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Titres */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatHeading("h1")}
          className="h-8 px-2 text-xs font-bold"
          title="Titre 1"
        >
          H1
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatHeading("h2")}
          className="h-8 px-2 text-xs font-bold"
          title="Titre 2"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatHeading("h3")}
          className="h-8 px-2 text-xs font-bold"
          title="Titre 3"
        >
          H3
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={formatParagraph}
          className="h-8 px-2 text-xs"
          title="Paragraphe"
        >
          P
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={formatQuote}
          className="h-8 w-8 p-0 text-xs"
          title="Citation"
        >
          "
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Listes */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatList("bullet")}
          className="h-8 w-8 p-0 text-xs"
          title="Liste à puces"
        >
          •
        </Button>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => formatList("number")}
          className="h-8 w-8 p-0 text-xs"
          title="Liste numérotée"
        >
          1.
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Tags et liens */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={insertHashtag}
          className="h-8 w-8 p-0 text-sm font-semibold"
          title="Insérer un hashtag"
        >
          #
        </Button>
        <LinkDialog onInsert={insertLink} />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Graphiques */}
      <div className="flex items-center gap-1">
        <ChartInsertDialog onInsert={insertChart} />
      </div>
    </div>
  );
}

