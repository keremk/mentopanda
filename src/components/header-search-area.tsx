"use client"

import { TrainingWithProgress } from "@/data/trainings"
import { SearchTrainings } from "./search-trainings"
import { usePathname } from "next/navigation"

interface HeaderSearchAreaProps {
  trainings: TrainingWithProgress[]
}

export function HeaderSearchArea({ trainings }: HeaderSearchAreaProps) {
  const pathname = usePathname()
  
  if (!pathname.startsWith("/trainings")) return null

  return (
    <div className="absolute top-0 right-0 p-4 z-10">
      <SearchTrainings 
        trainings={trainings} 
        onSearch={(filtered) => {
          // Dispatch a custom event that the page component will listen to
          window.dispatchEvent(
            new CustomEvent("trainingsFiltered", { 
              detail: filtered 
            })
          )
        }} 
      />
    </div>
  )
} 