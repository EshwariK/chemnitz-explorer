"use client"

import { useState, useEffect } from "react"
import { HeroSection } from "@/components/hero-section"
import { SearchFilters } from "@/components/search-filters"
import { MapPreview } from "@/components/map-preview"
import { ResultsList } from "@/components/results-list"
import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, List } from "lucide-react"
import { toast } from "sonner"
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
  const [mapSites, setMapSites] = useState<CulturalSite[]>([])
  const [currentFilters, setCurrentFilters] = useState({
    search: "",
    category: "all",
  })
  const [highlightedSiteId, setHighlightedSiteId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeView, setActiveView] = useState<"map" | "list">("map")

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
    loadAllSitesForMap({})
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

  const loadAllSitesForMap = async (filters: SearchFilterType) => {
    try {
      const params = new URLSearchParams({
        limit: "1000", // Load many more sites for the map
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
        setMapSites(data.data)
      }
    } catch (error) {
      console.error("Error loading sites for map:", error)
    }
  }

  const loadNearbySites = async (lat: number, lng: number, radius = 5) => {
    setSearchState((prev) => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/cultural-sites/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=50`)
      if (response.ok) {
        const nearbySites = await response.json()

        // Update both list and map with the same nearby sites
        setSearchState({
          sites: nearbySites,
          loading: false,
          page: 1,
          hasMore: false,
          totalPages: 1,
        })

        setMapSites(nearbySites)

        setCurrentFilters({
          search: `Within ${radius}km of your location`,
          category: "all",
        })

        toast.success(`Found ${nearbySites.length} cultural sites near you`)
      }
    } catch (error) {
      console.error("Error loading nearby sites:", error)
      setSearchState((prev) => ({ ...prev, loading: false }))
      toast.error("Failed to load nearby sites")
    }
  }

  const handleSearch = (filters: { search: string; category: string }) => {
    setCurrentFilters(filters)
    loadSites(1, filters)
    loadAllSitesForMap(filters)
  }

  const handleLoadMore = () => {
    if (searchState.hasMore && !searchState.loading) {
      loadSites(searchState.page + 1, currentFilters, true)
    }
  }

  const handleSiteClick = (site: CulturalSite) => {
    const siteId = site._id?.toString()
    setHighlightedSiteId(siteId || null)
    // Switch to map view when a site is clicked from the list
    setActiveView("map")
  }

  const handleMarkerClick = (site: CulturalSite) => {
    const siteId = site._id?.toString()
    setHighlightedSiteId(siteId || null)
  }

  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation((prev) => {
      if (!prev || prev.lat !== lat || prev.lng !== lng) {
        return { lat, lng }
      }
      return prev
    })
  }

  const handleFindNearby = () => {
    if (userLocation) {
      loadNearbySites(userLocation.lat, userLocation.lng, 5)
    } else {
      toast.warning("Please enable location access first")
    }
  }

  return (
    <div className="space-y-12 pb-12">
      <HeroSection />
      <div className="container mx-auto px-4 space-y-12">
        <SearchFilters onSearch={handleSearch} categories={categories} loading={searchState.loading} />

        {/* Location-based search */}
        {userLocation && (
          <div className="flex justify-center">
            <Button onClick={handleFindNearby} variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Find Sites Near Me
            </Button>
          </div>
        )}

        {/* Results Summary
        {searchState.sites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Search Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>Found {searchState.sites.length} cultural sites</span>
                {currentFilters.search && <span>• Search: &quot;{currentFilters.search}&quot;</span>}
                {currentFilters.category !== "all" && <span>• Category: {currentFilters.category}</span>}
                {userLocation && <span>• Location services enabled</span>}
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Tabbed Interface for Map and List */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "map" | "list")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <div className="space-y-6">
              <MapPreview
                sites={mapSites}
                highlightedSiteId={highlightedSiteId}
                onMarkerClick={handleMarkerClick}
                onLocationFound={handleLocationFound}
              />

              {/* Quick stats below map
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{searchState.sites.length}</div>
                    <div className="text-sm text-muted-foreground">Sites Found</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{categories.length}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{highlightedSiteId ? "1" : "0"}</div>
                    <div className="text-sm text-muted-foreground">Selected</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{userLocation ? "✓" : "✗"}</div>
                    <div className="text-sm text-muted-foreground">Location</div>
                  </CardContent>
                </Card>
              </div> */}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <ResultsList
              sites={searchState.sites}
              loading={searchState.loading}
              onLoadMore={handleLoadMore}
              hasMore={searchState.hasMore}
              onSiteClick={handleSiteClick}
              highlightedSiteId={highlightedSiteId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
