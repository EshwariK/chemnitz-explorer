"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ExternalLink, MapPin, Phone, Globe, Clock, Loader2, Map } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
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

  const handleFavorite = async (site: CulturalSite) => {
    if (!session) {
      toast.info("Please log in to save favorites")
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

    // Open in new tab or navigate to details page
    if (site.website) {
      window.open(site.website, "_blank")
    } else {
      // Navigate to details page (you can implement this)
      toast.info(`Viewing details for ${site.name}`)
    }
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
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Cultural Sites ({sites.length} found)</h3>
      <div className="space-y-4">
        {sites.map((site) => {
          const siteId = site._id?.toString()
          const isFavoriting = siteId ? favoritingIds.has(siteId) : false
          const isHighlighted = siteId === highlightedSiteId

          return (
            <Card
              key={siteId}
              className={`overflow-hidden transition-all duration-200 ${
                isHighlighted ? "ring-2 ring-primary shadow-lg" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={categoryColors[site.category as keyof typeof categoryColors] || ""}
                    >
                      {site.category}
                    </Badge>
                    {site.address && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {site.address}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFavorite(site)}
                    disabled={isFavoriting || !session}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    {isFavoriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {site.description && <p className="text-muted-foreground text-sm">{site.description}</p>}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {site.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {site.phone}
                    </div>
                  )}
                  {site.website && (
                    <div className="flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      Website
                    </div>
                  )}
                  {site.openingHours && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {site.openingHours}
                    </div>
                  )}
                  {site.accessibility?.wheelchair === "yes" && (
                    <Badge variant="outline" className="text-xs">
                      ♿ Accessible
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShowOnMap(site)}
                    className={isHighlighted ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    {isHighlighted ? "Highlighted" : "Show on Map"}
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleViewDetails(site)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button onClick={onLoadMore} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
