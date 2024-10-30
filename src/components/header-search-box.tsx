"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Fuse from "fuse.js"

type SearchableItem = {
  id: string | number
  [key: string]: any
}

type HeaderSearchBoxProps<T extends SearchableItem> = {
  items: T[]
  searchKeys: string[]
  placeholder?: string
  className?: string
  threshold?: number
  onSearch?: (filtered: T[]) => void
}

export function HeaderSearchBox<T extends SearchableItem>({
  items,
  searchKeys,
  placeholder = "Search...",
  className = "",
  threshold = 0.3,
  onSearch,
}: HeaderSearchBoxProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")

  function handleSearch(query: string) {
    setSearchQuery(query)
    
    if (!query.trim()) {
      onSearch?.(items)
      return
    }

    const fuse = new Fuse(items, {
      keys: searchKeys,
      threshold,
    })

    const results = fuse.search(query)
    onSearch?.(results.map(result => result.item))
  }

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
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