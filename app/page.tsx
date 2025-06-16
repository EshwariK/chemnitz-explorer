"use client"

import { useState, useEffect } from "react"
import { HeroSection } from "@/components/hero-section"
import { SearchFilters } from "@/components/search-filters"
import { MapPreview } from "@/components/map-preview"
import { ResultsList } from "@/components/results-list"
import type { CulturalSite, SearchFilters as SearchFilterType } from "@/lib/cultural-sites-service"

interface SearchState {
  sites: CulturalSite[]
  loading: boolean
  page: number
  hasMore: boolean
  totalPages: number
}

export default function HomePage() {
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([])
  const [searchState, setSearchState] = useState<SearchState>({
    sites: [],
    loading: true,
    page: 1,
    hasMore: false,
    totalPages: 0,
  })
  const [currentFilters, setCurrentFilters] = useState({
    search: "",
    category: "all",
  })
  const [highlightedSiteId, setHighlightedSiteId] = useState<string | null>(null)

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

  const loadSites = async (page: number, filters: SearchFilterType, append = false) => {
    setSearchState((prev) => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
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

        setSearchState((prev) => ({
          ...prev,
          sites: append ? [...prev.sites, ...data.data] : data.data,
          page: data.pagination.page,
          hasMore: data.pagination.page < data.pagination.totalPages,
          totalPages: data.pagination.totalPages,
          loading: false,
        }))

        // Clear highlighted site when new search is performed
        if (!append) {
          setHighlightedSiteId(null)
        }
      }
    } catch (error) {
      console.error("Error loading sites:", error)
      setSearchState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleSearch = (filters: { search: string; category: string }) => {
    setCurrentFilters(filters)
    loadSites(1, filters)
  }

  const handleLoadMore = () => {
    if (searchState.hasMore && !searchState.loading) {
      loadSites(searchState.page + 1, currentFilters, true)
    }
  }

  const handleSiteClick = (site: CulturalSite) => {
    const siteId = site._id?.toString()
    setHighlightedSiteId(siteId || null)
  }

  const handleMarkerClick = (site: CulturalSite) => {
    const siteId = site._id?.toString()
    setHighlightedSiteId(siteId || null)

    // Scroll to the corresponding result item
    const element = document.getElementById(`site-${siteId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div className="space-y-12 pb-12">
      <HeroSection />
      <div className="container mx-auto px-4 space-y-12">
        <SearchFilters onSearch={handleSearch} categories={categories} loading={searchState.loading} />
        <div className="grid lg:grid-cols-2 gap-8">
          <MapPreview
            sites={searchState.sites}
            highlightedSiteId={highlightedSiteId}
            onMarkerClick={handleMarkerClick}
          />
          <ResultsList
            sites={searchState.sites}
            loading={searchState.loading}
            onLoadMore={handleLoadMore}
            hasMore={searchState.hasMore}
            onSiteClick={handleSiteClick}
            highlightedSiteId={highlightedSiteId}
          />
        </div>
      </div>
    </div>
  )
}
