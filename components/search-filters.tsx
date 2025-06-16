"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface SearchFiltersProps {
  onSearch: (filters: {
    search: string
    category: string
  }) => void
  categories: Array<{ category: string; count: number }>
  loading?: boolean
}

export function SearchFilters({ onSearch, categories, loading = false }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const handleSearch = () => {
    onSearch({
      search: searchQuery,
      category: selectedCategory,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <section id="search" className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Find Cultural Sites</h2>
        <p className="text-muted-foreground">Search and filter through Chemnitz&apos;s cultural landmarks</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search cultural sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.category} value={category.category}>
                  {category.category} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
    </section>
  )
}
