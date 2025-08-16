"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface BrandedSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  color?: "brand" | "emerald" | "amber" | "red" | "slate" | "teal";
}

const BrandedSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  BrandedSliderProps
>(({ className, color = "brand", ...props }, ref) => {
  const rangeClasses = {
    brand: "bg-brand",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    slate: "bg-slate-500",
    teal: "bg-teal-500",
  };

  const thumbClasses = {
    brand: "border-brand bg-brand",
    emerald: "border-emerald-500 bg-emerald-500",
    amber: "border-amber-500 bg-amber-500",
    red: "border-red-500 bg-red-500",
    slate: "border-slate-500 bg-slate-500",
    teal: "border-teal-500 bg-teal-500",
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className={cn("absolute h-full", rangeClasses[color])} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={cn(
        "block h-5 w-5 rounded-full border-2 ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        thumbClasses[color]
      )} />
    </SliderPrimitive.Root>
  )
})
BrandedSlider.displayName = SliderPrimitive.Root.displayName

export { BrandedSlider }