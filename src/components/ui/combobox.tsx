"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat.",
  disabled = false,
  className,
  size = "default",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "select-trigger-accent border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex w-auto items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            size === "sm" && "h-8",
            size === "default" && "h-9",
            className
          )}
        >
          <span className="line-clamp-1 flex-1 text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        style={{ 
          width: `max(calc(var(--radix-popover-trigger-width) * 1.5), 200px)` 
        }}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange?.(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                  className="select-item-accent"
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0 transition-opacity",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

