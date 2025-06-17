"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Phone, Globe, Clock, Loader2, Map, Info } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { SiteDetailsModal } from "./site-details-modal"
import type { CulturalSite } from "@/lib/cultural-sites-service"

const categoryColors = {
  Theatre: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Museum: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Art: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Tourism Spots": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Monument: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Gallery: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  Library: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
}

interface ResultsListProps {
  sites: CulturalSite[]
  loading: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  onSiteClick?: (site: CulturalSite) => void
  highlightedSiteId?: string | null
}

export function ResultsList({ sites, loading, onLoadMore, hasMore, onSiteClick, highlightedSiteId }: ResultsListProps) {
  const { data: session } = useSession()
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set())
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const handleFavorite = async (site: CulturalSite) => {
    if (!session) {
      toast.warning("Please log in to save favorites")
      return
    }

    const siteId = site._id?.toString()
    if (!siteId) return

    setFavoritingIds((prev) => new Set(prev).add(siteId))

    try {
      const response = await fetch("/api/user/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: siteId,
          siteName: site.name,
          category: site.category,
          description: site.description || "",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.alreadyExists) {
          toast.info("This site is already in your favorites")
        } else {
          toast.success(`${site.name} has been added to your favorites`)
        }
      } else {
        toast.error("Failed to add to favorites")
      }
    } catch (error) {
      console.error("Error adding favorite:", error)
      toast.error("Failed to add to favorites")
    } finally {
      setFavoritingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(siteId)
        return newSet
      })
    }
  }

  const handleViewDetails = async (site: CulturalSite) => {
    // Track activity
    if (session) {
      try {
        await fetch("/api/user/activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "viewed",
            siteId: site._id?.toString(),
            siteName: site.name,
            category: site.category,
          }),
        })
      } catch (error) {
        console.error("Error tracking activity:", error)
      }
    }

    // Open details modal
    setSelectedSite(site)
    setDetailsModalOpen(true)
  }

  const handleShowOnMap = (site: CulturalSite) => {
    onSiteClick?.(site)
    // Scroll to top to show the map
    document.getElementById("search")?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading && sites.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">Cultural Sites</h3>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">Cultural Sites</h3>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cultural sites found matching your criteria.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">Cultural Sites ({sites.length} found)</h3>

        {/* Flex Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sites.map((site) => {
            const siteId = site._id?.toString()
            const isFavoriting = siteId ? favoritingIds.has(siteId) : false
            const isHighlighted = siteId === highlightedSiteId

            return (
              <Card
                key={siteId}
                id={`site-${siteId}`}
                className={`overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col h-full ${
                  isHighlighted ? "ring-2 ring-primary shadow-lg" : ""
                }`}
              >
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight line-clamp-2">{site.name}</CardTitle>
                      <Badge
                        variant="secondary"
                        className={`${categoryColors[site.category as keyof typeof categoryColors] || ""} text-xs`}
                      >
                        {site.category}
                      </Badge>
                      {site.address && (
                        <div className="flex items-start text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{site.address}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFavorite(site)}
                      disabled={isFavoriting || !session}
                      className="text-muted-foreground hover:text-red-500 flex-shrink-0 ml-2"
                    >
                      {isFavoriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                  {site.description && (
                    <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{site.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {site.phone && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="truncate">Phone</span>
                      </div>
                    )}
                    {site.website && (
                      <div className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        <span>Website</span>
                      </div>
                    )}
                    {site.openingHours && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="truncate">Hours</span>
                      </div>
                    )}
                    {site.accessibility?.wheelchair === "yes" && (
                      <Badge variant="outline" className="text-xs">
                        ♿ Accessible
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-auto pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowOnMap(site)}
                      className={`w-full ${isHighlighted ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      <Map className="h-4 w-4 mr-2" />
                      {isHighlighted ? "Highlighted on Map" : "Show on Map"}
                    </Button>
                    <Button size="sm" className="w-full" onClick={() => handleViewDetails(site)}>
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {hasMore && (
          <div className="text-center pt-6">
            <Button onClick={onLoadMore} disabled={loading} variant="outline" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Sites"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Site Details Modal */}
      <SiteDetailsModal site={selectedSite} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
    </>
  )
}
