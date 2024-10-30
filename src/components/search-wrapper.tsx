"use client"

import { HeaderSearchBox } from "@/components/header-search-box"

type SearchableItem = {
  id: string | number
  [key: string]: any
}

type SearchWrapperProps<T extends SearchableItem> = {
  items: T[]
  searchKeys: string[]
  placeholder?: string
}

export function SearchWrapper<T extends SearchableItem>({ 
  items, 
  searchKeys, 
  placeholder 
}: SearchWrapperProps<T>) {
  return (
    <div className="absolute top-0 right-0 p-4 z-10">
      <HeaderSearchBox
        items={items}
        searchKeys={searchKeys}
        placeholder={placeholder}
        onSearch={(filtered) => {
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