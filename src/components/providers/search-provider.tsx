"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { TrainingWithProgress } from "@/data/trainings"

interface SearchContextType {
  setFilteredTrainings: (trainings: TrainingWithProgress[]) => void
  filteredTrainings: TrainingWithProgress[]
  initialTrainings: TrainingWithProgress[]
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

interface SearchProviderProps {
  children: ReactNode
  initialTrainings: TrainingWithProgress[]
}

export function SearchProvider({ children, initialTrainings }: SearchProviderProps) {
  const [filteredTrainings, setFilteredTrainings] = useState(initialTrainings)

  return (
    <SearchContext.Provider value={{ 
      filteredTrainings, 
      setFilteredTrainings,
      initialTrainings
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error("useSearch must be used within SearchProvider")
  return context
} 