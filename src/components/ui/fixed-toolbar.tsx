'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'sticky top-0 left-0 z-50 scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1.5 px-4 md:px-6 lg:px-8 backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        'flex-wrap min-h-[3.5rem] gap-1.5',
        props.className
      )}
    />
  );
}
