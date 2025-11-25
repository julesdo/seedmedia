'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { DndPlugin } from '@platejs/dnd';
import { PlaceholderPlugin } from '@platejs/media/react';

import { BlockDraggable } from '@/components/ui/block-draggable';

/**
 * DndKit - Configuration selon la documentation Plate.js
 * Le DndProvider est dans render.aboveSlate pour chaque éditeur
 * Cela permet à useDraggable d'accéder au contexte DndProvider
 */
export const DndKit = [
  DndPlugin.configure({
    options: {
      enableScroller: true,
      onDropFiles: ({ dragItem, editor, target }) => {
        editor
          .getTransforms(PlaceholderPlugin)
          .insert.media(dragItem.files, { at: target, nextBlock: false });
      },
    },
    render: {
      aboveNodes: BlockDraggable,
      aboveSlate: ({ children }) => (
        <DndProvider backend={HTML5Backend}>
          {children}
        </DndProvider>
      ),
    },
  }),
];
