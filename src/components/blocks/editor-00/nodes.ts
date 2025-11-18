import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { LinkNode } from "@lexical/link"
import {
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  ParagraphNode,
  TextNode,
} from "lexical"
import { HashtagNode } from "./nodes/hashtag-node"
import { LinkPreviewNode } from "./nodes/link-node"
import { ChartNode } from "./nodes/chart-node"

export const nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> =
  [HeadingNode, ParagraphNode, TextNode, QuoteNode, ListNode, ListItemNode, LinkNode, HashtagNode, LinkPreviewNode, ChartNode]
