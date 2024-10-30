"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Fuse from "fuse.js"
import { TrainingWithProgress } from "@/data/trainings"

interface SearchTrainingsProps {
  trainings: TrainingWithProgress[]
  onSearch?: (filtered: TrainingWithProgress[]) => void
}

export function SearchTrainings({ trainings, onSearch }: SearchTrainingsProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      onSearch?.(trainings)
      return
    }

    const fuse = new Fuse(trainings, {
      keys: ["title", "description"],
      threshold: 0.3,
    })

    const results = fuse.search(query)
    onSearch?.(results.map(result => result.item))
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search trainings..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 pr-4 py-2 w-64"
      />
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={20}
      />
    </div>
  )
} 