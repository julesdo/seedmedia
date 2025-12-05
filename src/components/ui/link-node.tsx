'use client';

import * as React from 'react';

import type { TInlineSuggestionData, TLinkElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { getLinkAttributes } from '@platejs/link';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function LinkElement(props: PlateElementProps<TLinkElement>) {
  // Vérifier si le plugin de suggestion est disponible
  let suggestionData: TInlineSuggestionData | undefined;
  try {
    const suggestionApi = props.editor.getApi(SuggestionPlugin);
    if (suggestionApi?.suggestion) {
      suggestionData = suggestionApi.suggestion.suggestionData(props.element) as
        | TInlineSuggestionData
        | undefined;
    }
  } catch {
    // Le plugin de suggestion n'est pas disponible (mode lecture seule)
    suggestionData = undefined;
  }

  return (
    <PlateElement
      {...props}
      as="a"
      className={cn(
        'font-medium text-primary underline decoration-primary underline-offset-4',
        suggestionData?.type === 'remove' && 'bg-red-100 text-red-700',
        suggestionData?.type === 'insert' && 'bg-emerald-100 text-emerald-700'
      )}
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
        onMouseOver: (e) => {
          e.stopPropagation();
        },
      }}
    >
      {props.children}
    </PlateElement>
  );
}
