"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { SearchFilters } from "@/components/search-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, BarChart3 } from "lucide-react"
import type { CulturalSite, SearchFilters as SearchFilterType } from "@/lib/cultural-sites-service"

const InteractiveMap = dynamic(() => import("@/components/interactive-map"), { ssr: false })

interface SearchState {
  sites: CulturalSite[]
  loading: boolean
  page: number
  hasMore: boolean
  totalPages: number
}

export default function MapPage() {
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([])
  const [searchState, setSearchState] = useState<SearchState>({
    sites: [],
    loading: true,
    page: 1,
    hasMore: false,
    totalPages: 0,
  })
//   const [currentFilters, setCurrentFilters] = useState({
//     search: "",
//     category: "all",
//   })
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null)

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/cultural-sites/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }

    loadCategories()
  }, [])

  // Load initial sites
  useEffect(() => {
    loadSites(1, {})
  }, [])

  const loadSites = async (page: number, filters: SearchFilterType) => {
    setSearchState((prev) => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "100", // Load more sites for map view
      })

      if (filters.search) {
        params.append("search", filters.search)
      }
      if (filters.category && filters.category !== "all") {
        params.append("category", filters.category)
      }

      const response = await fetch(`/api/cultural-sites?${params}`)
      if (response.ok) {
        const data = await response.json()

        setSearchState({
          sites: data.data,
          page: data.pagination.page,
          hasMore: data.pagination.page < data.pagination.totalPages,
          totalPages: data.pagination.totalPages,
          loading: false,
        })

        setSelectedSite(null)
      }
    } catch (error) {
      console.error("Error loading sites:", error)
      setSearchState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleSearch = (filters: { search: string; category: string }) => {
    // setCurrentFilters(filters)
    loadSites(1, filters)
  }

  const handleMarkerClick = (site: CulturalSite) => {
    setSelectedSite(site)
  }

//   const categoryStats = categories.reduce((acc, cat) => acc + cat.count, 0)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Cultural Sites Map</h1>
        <p className="text-muted-foreground text-lg">Explore Chemnitz&apos;s cultural landmarks on an interactive map</p>
      </div>

      <SearchFilters onSearch={handleSearch} categories={categories} loading={searchState.loading} />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <InteractiveMap sites={searchState.sites} onMarkerClick={handleMarkerClick} height="600px" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Sites</span>
                <Badge variant="secondary">{searchState.sites.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Categories</span>
                <Badge variant="secondary">{categories.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.category} className="flex items-center justify-between text-sm">
                    <span>{category.category}</span>
                    <Badge variant="outline">{category.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Site */}
          {selectedSite && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Selected Site
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">{selectedSite.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {selectedSite.category}
                  </Badge>
                </div>
                {selectedSite.description && (
                  <p className="text-sm text-muted-foreground">{selectedSite.description}</p>
                )}
                {selectedSite.address && (
                  <div className="flex items-start text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{selectedSite.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
