"use client";

import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $getNodeByKey,
} from "lexical";
import { LinkNode as LexicalLinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LinkPreview } from "@/components/editor/editor-ui/link-preview";

export type SerializedLinkPreviewNode = Spread<
  {
    url: string;
    text?: string;
  },
  SerializedLexicalNode
>;

export class LinkPreviewNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __text?: string;

  static getType(): string {
    return "link-preview";
  }

  static clone(node: LinkPreviewNode): LinkPreviewNode {
    return new LinkPreviewNode(node.__url, node.__text, node.__key);
  }

  constructor(url: string, text?: string, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__text = text;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedLinkPreviewNode): LinkPreviewNode {
    const { url, text } = serializedNode;
    return new LinkPreviewNode(url, text);
  }

  exportJSON(): SerializedLinkPreviewNode {
    return {
      url: this.__url,
      text: this.__text,
      type: "link-preview",
      version: 1,
    };
  }

  getURL(): string {
    return this.__url;
  }

  getText(): string | undefined {
    return this.__text;
  }

  setURL(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  setText(text: string | undefined): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  decorate(): JSX.Element {
    return <LinkPreviewComponent nodeKey={this.__key} url={this.__url} text={this.__text} />;
  }

  isInline(): boolean {
    return true; // Les link previews sont inline pour ne pas bloquer l'éditeur
  }
}

export function $createLinkPreviewNode(url: string, text?: string): LinkPreviewNode {
  return new LinkPreviewNode(url, text);
}

export function $isLinkPreviewNode(
  node: LexicalNode | null | undefined
): node is LinkPreviewNode {
  return node instanceof LinkPreviewNode;
}

// Composant React pour le rendu avec fonctionnalité de suppression
function LinkPreviewComponent({ nodeKey, url, text }: { nodeKey: string; url: string; text?: string }) {
  const [editor] = useLexicalComposerContext();

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isLinkPreviewNode(node)) {
        node.remove();
      }
    });
  };

  return <LinkPreview url={url} text={text} className="my-1" onDelete={handleDelete} />;
}

