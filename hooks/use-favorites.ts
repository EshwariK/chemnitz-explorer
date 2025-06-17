"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import type { CulturalSite } from "@/lib/cultural-sites-service"

export function useFavorites() {
  const { data: session } = useSession()
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Load user favorites
  const loadFavorites = useCallback(async () => {
    if (!session) {
      setUserFavorites(new Set())
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/user/favorites")
      if (response.ok) {
        const favorites = await response.json()
        const favoriteIds = new Set<string>(favorites.map((fav: { siteId: string }) => fav.siteId))
        setUserFavorites(favoriteIds)
      }
    } catch (error) {
      console.error("Error loading favorites:", error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (site: CulturalSite) => {
      if (!session) {
        toast.warning("Please log in to save favorites")
        return false
      }

      const siteId = site._id?.toString()
      if (!siteId) return false

      setFavoritingIds((prev) => new Set(prev).add(siteId))

      try {
        const isFavorited = userFavorites.has(siteId)

        if (isFavorited) {
          // Remove from favorites
          const response = await fetch(`/api/user/favorites?siteId=${siteId}`, {
            method: "DELETE",
          })

          if (response.ok) {
            setUserFavorites((prev) => {
              const newSet = new Set(prev)
              newSet.delete(siteId)
              return newSet
            })
            toast.info(`${site.name} has been removed from your favorites`)
            return false
          }
        } else {
          // Add to favorites
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
              coordinates: site.coordinates,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.alreadyExists) {
              toast.info("This site is already in your favorites")
            } else {
              setUserFavorites((prev) => new Set(prev).add(siteId))
              toast.success(`${site.name} has been added to your favorites`)
              return true
            }
          }
        }
      } catch (error) {
        console.error("Error updating favorite:", error)
        toast.error("Failed to update favorites")
      } finally {
        setFavoritingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(siteId)
          return newSet
        })
      }

      return false
    },
    [session, userFavorites],
  )

  // Check if a site is favorited
  const isFavorited = useCallback(
    (siteId: string | undefined) => {
      return siteId ? userFavorites.has(siteId) : false
    },
    [userFavorites],
  )

  // Check if a site is being favorited
  const isFavoriting = useCallback(
    (siteId: string | undefined) => {
      return siteId ? favoritingIds.has(siteId) : false
    },
    [favoritingIds],
  )

  return {
    userFavorites,
    loading,
    toggleFavorite,
    isFavorited,
    isFavoriting,
    loadFavorites,
  }
}
