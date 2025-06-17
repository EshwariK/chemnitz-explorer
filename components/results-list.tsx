"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Phone, Globe, Clock, Loader2, Map, Info } from "lucide-react"
import { useSession } from "next-auth/react"
import { SiteDetailsModal } from "./site-details-modal"
import type { CulturalSite } from "@/lib/cultural-sites-service"
import { useFavorites } from "@/hooks/use-favorites"

const categoryColors = {
  Theatre: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/30",
  Museum: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/30",
  Artwork: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/30",
  Gallery: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/30",
  Memorial: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/30",
  Restaurant: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/30",
  Library: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/30",
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
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const { toggleFavorite, isFavorited, isFavoriting } = useFavorites()

  const handleFavorite = async (site: CulturalSite) => {
    await toggleFavorite(site)
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
        <h3 className="text-2xl font-bold text-foreground">Cultural Sites</h3>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-foreground">Cultural Sites</h3>
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
        <h3 className="text-2xl font-bold text-foreground">Cultural Sites ({sites.length} found)</h3>

        {/* Flex Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sites.map((site) => {
            const siteId = site._id?.toString()
            const isHighlighted = siteId === highlightedSiteId
            const isCurrentlyFavorited = isFavorited(siteId)
            const isCurrentlyFavoriting = isFavoriting(siteId)

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
                      disabled={isCurrentlyFavoriting}
                      className={`text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex-shrink-0 ml-3 h-8 w-8 transition-colors ${
                        isCurrentlyFavorited ? "text-rose-500" : ""
                      }`}
                    >
                      {isCurrentlyFavoriting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 ${isCurrentlyFavorited ? "fill-current" : ""}`} />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col pt-0">
                  {site.description && (
                    <p className="text-muted-foreground text-sm line-clamp-3 flex-1 leading-relaxed">
                      {site.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs">
                    {site.phone && (
                      <div className="flex items-center text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                        <Phone className="h-3 w-3 mr-1.5" />
                        <span>Phone</span>
                      </div>
                    )}
                    {site.website && (
                      <div className="flex items-center text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                        <Globe className="h-3 w-3 mr-1.5" />
                        <span>Website</span>
                      </div>
                    )}
                    {site.openingHours && (
                      <div className="flex items-center text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                        <Clock className="h-3 w-3 mr-1.5" />
                        <span>Hours</span>
                      </div>
                    )}
                    {site.accessibility?.wheelchair === "yes" && (
                      <div className="flex items-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full px-2.5 py-1 border border-emerald-200 dark:border-emerald-800/30">
                        <span className="text-xs font-medium">♿ Accessible</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 mt-auto pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowOnMap(site)}
                      className={`w-full transition-all duration-200 ${
                        isHighlighted
                          ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/30 dark:hover:bg-orange-950/50"
                          : "hover:bg-muted/80 border-muted-foreground/20"
                      }`}
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
                  Loading more sites...
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
