"use client";

import {
  $applyNodeReplacement,
  $createTextNode,
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { Badge } from "@/components/ui/badge";

export type SerializedHashtagNode = Spread<
  {
    tag: string;
  },
  SerializedLexicalNode
>;

export class HashtagNode extends DecoratorNode<JSX.Element> {
  __tag: string;

  static getType(): string {
    return "hashtag";
  }

  static clone(node: HashtagNode): HashtagNode {
    return new HashtagNode(node.__tag, node.__key);
  }

  constructor(tag: string, key?: NodeKey) {
    super(key);
    this.__tag = tag;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("span");
    // Ne pas ajouter de classe ici, le decorate() gère le style
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedHashtagNode): HashtagNode {
    const { tag } = serializedNode;
    const node = $createHashtagNode(tag);
    return node;
  }

  exportJSON(): SerializedHashtagNode {
    return {
      tag: this.__tag,
      type: "hashtag",
      version: 1,
    };
  }

  getTag(): string {
    return this.__tag;
  }

  setTag(tag: string): void {
    const writable = this.getWritable();
    writable.__tag = tag;
  }

  decorate(): JSX.Element {
    // Rendu du hashtag avec le style badge glassy (utiliser data-slot="badge" pour activer les styles CSS)
    // Utiliser les mêmes classes que le composant Badge de shadcn/ui
    return (
      <span
        data-slot="badge"
        data-lexical-hashtag={this.__tag}
        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden relative cursor-pointer"
      >
        #{this.__tag}
      </span>
    );
  }

  isInline(): boolean {
    return true;
  }
}

export function $createHashtagNode(tag: string): HashtagNode {
  return $applyNodeReplacement(new HashtagNode(tag));
}

export function $isHashtagNode(
  node: LexicalNode | null | undefined
): node is HashtagNode {
  return node instanceof HashtagNode;
}

