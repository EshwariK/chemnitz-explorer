"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, ExternalLink, Trash2, Loader2, MapPin, List, Grid } from "lucide-react"
import { toast } from "sonner"
import { SiteDetailsModal } from "./site-details-modal"
import type { UserFavorite } from "@/lib/user-service"
import { CulturalSite } from "@/lib/cultural-sites-service"

const categoryColors = {
  Theatre: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/30",
  Museum: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/30",
  Artwork: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/30",
  Gallery: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/30",
  Memorial: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/30",
  Restaurant: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/30",
  Library: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/30",
}

export function FavoritesList() {
  const [favorites, setFavorites] = useState<UserFavorite[]>([])
  const [favoritesByCategory, setFavoritesByCategory] = useState<
    Array<{ category: string; count: number; sites: UserFavorite[] }>
  >([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<CulturalSite| null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"all" | "category">("all")

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const [allFavs, categoryFavs] = await Promise.all([
        fetch("/api/user/favorites").then((res) => res.json()),
        fetch("/api/user/favorites?groupBy=category").then((res) => res.json()),
      ])

      setFavorites(allFavs)
      setFavoritesByCategory(categoryFavs)
    } catch (error) {
      console.error("Error fetching favorites:", error)
      toast.error("Failed to load favorites")
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (siteId: string) => {
    try {
      setRemovingId(siteId)
      const response = await fetch(`/api/user/favorites?siteId=${siteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.siteId !== siteId))
        setFavoritesByCategory((prev) =>
          prev
            .map((cat) => ({
              ...cat,
              sites: cat.sites.filter((site) => site.siteId !== siteId),
              count: cat.sites.filter((site) => site.siteId !== siteId).length,
            }))
            .filter((cat) => cat.count > 0),
        )
        toast.success("Site removed from favorites")
      } else {
        toast.error("Failed to remove from favorites")
      }
    } catch (error) {
      console.error("Error removing favorite:", error)
      toast.error("Failed to remove from favorites")
    } finally {
      setRemovingId(null)
    }
  }

  const handleViewDetails = (site: UserFavorite) => {
    // Convert UserFavorite to CulturalSite format for the modal
    const siteForModal = {
      _id: site._id,
      name: site.siteName,
      category: site.category,
      description: site.description,
      coordinates: site.coordinates,
      tags: {},
      osmId: site.siteId,
      createdAt: site.dateAdded,
      updatedAt: site.dateAdded,
    }
    setSelectedSite(siteForModal)
    setDetailsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground text-center">
            Start exploring cultural sites and add them to your favorites!
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderFavoriteCard = (site: UserFavorite) => (
    <Card key={site._id?.toString()} className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg">{site.siteName}</CardTitle>
            <Badge variant="outline" className={categoryColors[site.category as keyof typeof categoryColors] || ""}>
              {site.category}
            </Badge>
            {site.coordinates && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>
                  {site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-red-500">
            <Heart className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{site.description}</p>
        <div className="text-xs text-muted-foreground">Added on {new Date(site.dateAdded).toLocaleDateString()}</div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => handleViewDetails(site)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeFavorite(site.siteId)}
            disabled={removingId === site.siteId}
          >
            {removingId === site.siteId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "all" | "category")}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            All Favorites
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            By Category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{favorites.map(renderFavoriteCard)}</div>
        </TabsContent>

        <TabsContent value="category" className="mt-6">
          <div className="space-y-8">
            {favoritesByCategory.map((categoryGroup) => (
              <div key={categoryGroup.category}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-semibold">{categoryGroup.category}</h3>
                  <Badge variant="secondary">{categoryGroup.count} sites</Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categoryGroup.sites.map(renderFavoriteCard)}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <SiteDetailsModal site={selectedSite} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
    </>
  )
}
