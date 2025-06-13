"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ExternalLink, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { UserFavorite } from "@/lib/user-service"

const categoryColors = {
  Theatre: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Museum: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Art: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Tourism Spots": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

export function FavoritesList() {
  const [favorites, setFavorites] = useState<UserFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/favorites")
      if (response.ok) {
        const data = await response.json()
        setFavorites(data)
      } else {
        toast.error("Failed to load favorites")
      }
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map((site) => (
        <Card key={site._id?.toString()}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg">{site.siteName}</CardTitle>
                <Badge
                  variant="secondary"
                  className={categoryColors[site.category as keyof typeof categoryColors] || ""}
                >
                  {site.category}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="text-red-500">
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">{site.description}</p>
            <div className="text-xs text-muted-foreground">
              Added on {new Date(site.dateAdded).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFavorite(site.siteId)}
                disabled={removingId === site.siteId}
              >
                {removingId === site.siteId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
