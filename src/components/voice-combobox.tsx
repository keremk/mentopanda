"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const voices = [
  { value: "ash", label: "Ash" },
  { value: "ballad", label: "Ballad" },
  { value: "coral", label: "Coral" },
  { value: "sage", label: "Sage" },
  { value: "verse", label: "Verse" },
] as const

export type VoiceOption = (typeof voices)[number]["value"]

type VoiceComboboxProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function VoiceCombobox({ value, onChange, className }: VoiceComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? voices.find((voice) => voice.value === value)?.label
            : "Select voice..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start" sideOffset={4}>
        <Command className="w-full">
          <CommandList>
            <CommandEmpty>No voice found.</CommandEmpty>
            <CommandGroup>
              {voices.map((voice) => (
                <CommandItem
                  key={voice.value}
                  value={voice.label}
                  onSelect={() => {
                    onChange(voice.value)
                    setOpen(false)
                  }}
                >
                  {voice.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === voice.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
