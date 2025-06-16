"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { SearchFilters } from "@/components/search-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, BarChart3, Navigation } from "lucide-react"
import type { CulturalSite, SearchFilters as SearchFilterType } from "@/lib/cultural-sites-service"
import { toast } from "sonner"

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
  // const [currentFilters, setCurrentFilters] = useState({
  //   search: "",
  //   category: "all",
  // })
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

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

  const loadNearbySites = async (lat: number, lng: number, radius = 10) => {
    setSearchState((prev) => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/cultural-sites/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=100`)
      if (response.ok) {
        const nearbySites = await response.json()

        setSearchState({
          sites: nearbySites,
          loading: false,
          page: 1,
          hasMore: false,
          totalPages: 1,
        })

        // setCurrentFilters({
        //   search: `Within ${radius}km of your location`,
        //   category: "all",
        // })

        toast.success(`Found ${nearbySites.length} cultural sites near you`)
      }
    } catch (error) {
      console.error("Error loading nearby sites:", error)
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
      loadNearbySites(userLocation.lat, userLocation.lng, 10)
    } else {
      toast.warning("Please enable location access first")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Cultural Sites Map</h1>
        <p className="text-muted-foreground text-lg">Explore Chemnitz&apos;s cultural landmarks on an interactive map</p>
      </div>

      <SearchFilters onSearch={handleSearch} categories={categories} loading={searchState.loading} />

      {/* Location-based search */}
      {userLocation && (
        <div className="flex justify-center">
          <Button onClick={handleFindNearby} variant="outline" className="gap-2">
            <Navigation className="h-4 w-4" />
            Find Sites Near Me (10km)
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <InteractiveMap
                sites={searchState.sites}
                onMarkerClick={handleMarkerClick}
                onLocationFound={handleLocationFound}
                height="600px"
                showLocationControl={true}
                showNearbySearch={true}
              />
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
              {userLocation && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Location</span>
                  <Badge variant="outline">📍 Found</Badge>
                </div>
              )}
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
                {userLocation && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Distance:</strong>{" "}
                    {calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      selectedSite.coordinates.lat,
                      selectedSite.coordinates.lng,
                    ).toFixed(1)}
                    km from your location
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

// Helper function to calculate distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
