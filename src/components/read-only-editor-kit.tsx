'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor } from 'platejs/react';

import { BasicBlocksKit } from '@/components/basic-blocks-kit';
import { BasicMarksKit } from '@/components/basic-marks-kit';
import { CodeBlockKit } from '@/components/code-block-kit';
import { TableKit } from '@/components/table-kit';
import { ToggleKit } from '@/components/toggle-kit';
import { TocKit } from '@/components/toc-kit';
import { MediaKit } from '@/components/media-kit';
import { CalloutKit } from '@/components/callout-kit';
import { ColumnKit } from '@/components/column-kit';
import { MathKit } from '@/components/math-kit';
import { DateKit } from '@/components/date-kit';
import { LinkKit } from '@/components/link-kit';
import { MentionKit } from '@/components/mention-kit';
import { ListKit } from '@/components/list-kit';
import { AlignKit } from '@/components/align-kit';
import { LineHeightKit } from '@/components/line-height-kit';
import { FontKit } from '@/components/font-kit';
import { BlockPlaceholderKit } from '@/components/block-placeholder-kit';

/**
 * Kit d'éditeur simplifié pour le mode lecture
 * Exclut toutes les fonctionnalités d'édition : toolbar, drag & drop, suggestions, AI, etc.
 */
export const ReadOnlyEditorKit = [
  // Elements de base (affichage uniquement)
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks (affichage uniquement)
  ...BasicMarksKit,
  ...FontKit,

  // Block Style (affichage uniquement)
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // UI minimale
  ...BlockPlaceholderKit,
  TrailingBlockPlugin,
];

export type ReadOnlyEditor = TPlateEditor<Value, (typeof ReadOnlyEditorKit)[number]>;

