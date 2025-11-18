import { JSX } from "react"
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"

type Props = {
  placeholder: string
  className?: string
  placeholderClassName?: string
}

export function ContentEditable({
  placeholder,
  className,
  placeholderClassName,
}: Props): JSX.Element {
  return (
    <LexicalContentEditable
      className={
        className ??
        `ContentEditable__root relative block min-h-full px-6 py-6 focus:outline-none prose prose-sm max-w-none dark:prose-invert text-foreground bg-background/80 dark:bg-background/60`
      }
      aria-placeholder={placeholder}
      placeholder={
        <div
          className={
            placeholderClassName ??
            `text-muted-foreground/60 pointer-events-none absolute top-6 left-6 overflow-hidden text-ellipsis select-none`
          }
        >
          {placeholder}
        </div>
      }
    />
  )
}
