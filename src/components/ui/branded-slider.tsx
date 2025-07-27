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
  const colorClasses = {
    brand: "data-[state=active]:bg-brand data-[state=active]:border-brand [&_.bg-primary]:bg-brand [&_[data-state=active]]:bg-brand",
    emerald: "data-[state=active]:bg-emerald-500 data-[state=active]:border-emerald-500 [&_.bg-primary]:bg-emerald-500 [&_[data-state=active]]:bg-emerald-500",
    amber: "data-[state=active]:bg-amber-500 data-[state=active]:border-amber-500 [&_.bg-primary]:bg-amber-500 [&_[data-state=active]]:bg-amber-500",
    red: "data-[state=active]:bg-red-500 data-[state=active]:border-red-500 [&_.bg-primary]:bg-red-500 [&_[data-state=active]]:bg-red-500",
    slate: "data-[state=active]:bg-slate-500 data-[state=active]:border-slate-500 [&_.bg-primary]:bg-slate-500 [&_[data-state=active]]:bg-slate-500",
    teal: "data-[state=active]:bg-teal-500 data-[state=active]:border-teal-500 [&_.bg-primary]:bg-teal-500 [&_[data-state=active]]:bg-teal-500",
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
        <SliderPrimitive.Range className={cn("absolute h-full", colorClasses[color])} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={cn(
        "block h-5 w-5 rounded-full border-2 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        colorClasses[color]
      )} />
    </SliderPrimitive.Root>
  )
})
BrandedSlider.displayName = SliderPrimitive.Root.displayName

export { BrandedSlider }