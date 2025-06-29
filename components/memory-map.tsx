"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Sparkles,
  Calendar,
  Eye,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Info,
  Heart,
  Maximize2,
  Minimize2,
  Upload,
  X,
} from "lucide-react"
import type { UserMemory } from "@/lib/memory-service"
import type { CulturalSite } from "@/lib/cultural-sites-service"
import Image from "next/image"
import { toast } from "sonner"
import { SiteDetailsModal } from "./site-details-modal"
import type { UserFavorite } from "@/lib/user-service"
import ReactDOM from "react-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

// Fix for default markers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Group memories by location (within ~50 meters)
const groupMemoriesByLocation = (memories: UserMemory[]) => {
  const groups: Array<{ memories: UserMemory[]; center: { lat: number; lng: number } }> = []
  const threshold = 0.0005 // Approximately 50 meters

  for (const memory of memories) {
    let foundGroup = false

    for (const group of groups) {
      const distance = Math.sqrt(
        Math.pow(group.center.lat - memory.coordinates.lat, 2) + Math.pow(group.center.lng - memory.coordinates.lng, 2),
      )

      if (distance <= threshold) {
        group.memories.push(memory)
        // Update center to average position
        const totalLat = group.memories.reduce((sum, m) => sum + m.coordinates.lat, 0)
        const totalLng = group.memories.reduce((sum, m) => sum + m.coordinates.lng, 0)
        group.center = {
          lat: totalLat / group.memories.length,
          lng: totalLng / group.memories.length,
        }
        foundGroup = true
        break
      }
    }

    if (!foundGroup) {
      groups.push({
        memories: [memory],
        center: { lat: memory.coordinates.lat, lng: memory.coordinates.lng },
      })
    }
  }

  return groups
}

// Check if a favorite site has memories at the same location
const filterFavoritesWithoutMemories = (favorites: UserFavorite[], memories: UserMemory[]) => {
  const threshold = 0.0005 // Same threshold as memory grouping

  return favorites.filter((favorite) => {
    // Check if any memory exists at this favorite's location
    const hasMemoryAtLocation = memories.some((memory) => {
      const distance = Math.sqrt(
        Math.pow(favorite.coordinates.lat - memory.coordinates.lat, 2) +
          Math.pow(favorite.coordinates.lng - memory.coordinates.lng, 2),
      )
      return distance <= threshold
    })
    return !hasMemoryAtLocation
  })
}

// Check if a memory location is also favorited
const isMemoryLocationFavorited = (memory: UserMemory, favorites: UserFavorite[]) => {
  const threshold = 0.0005
  return favorites.some((favorite) => {
    const distance = Math.sqrt(
      Math.pow(favorite.coordinates.lat - memory.coordinates.lat, 2) +
        Math.pow(favorite.coordinates.lng - memory.coordinates.lng, 2),
    )
    return distance <= threshold
  })
}

// Create magical memory marker with count and favorite indicator
const createMemoryIcon = (count: number, isPersonal = false, isFavorited = false) => {
  const color = isPersonal ? "#ec4899" : "#10b981" // Pink for personal, emerald for public
  const size = count > 1 ? 35 : 30

  return L.divIcon({
    html: `
      <div style="
        background: radial-gradient(circle, ${color}40 0%, ${color}20 50%, transparent 70%);
        width: ${size * 2}px;
        height: ${size * 2}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: gentlePulse 3s ease-in-out infinite;
        position: relative;
      ">
        <div style="
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 20px ${color}40;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            color: white; 
            font-size: ${count > 1 ? "12px" : "14px"}; 
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 2px;
          ">
            ${count > 1 ? `${count}✨` : "✨"}
          </div>
          <div style="
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
            animation: shimmer 4s ease-in-out infinite;
          "></div>
        </div>
        ${
          isFavorited
            ? `<div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">❤️</div>`
            : ""
        }
      </div>
      <style>
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      </style>
    `,
    className: "memory-marker",
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
  })
}

// Create favorite site marker
const createFavoriteIcon = () => {
  const color = "#f59e0b" // Amber color for favorites
  const size = 30

  return L.divIcon({
    html: `
      <div style="
        background: radial-gradient(circle, ${color}40 0%, ${color}20 50%, transparent 70%);
        width: ${size * 2}px;
        height: ${size * 2}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: gentlePulse 3s ease-in-out infinite;
      ">
        <div style="
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 20px ${color}40;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            color: white; 
            font-size: 14px; 
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 2px;
          ">
            ❤️
          </div>
          <div style="
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
            animation: shimmer 4s ease-in-out infinite;
          "></div>
        </div>
      </div>
      <style>
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      </style>
    `,
    className: "favorite-marker",
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
  })
}

interface TinyPerfectMapProps {
  memories: UserMemory[]
  favorites?: UserFavorite[]
  height?: string
  showUserLocation?: boolean
  personalMap?: boolean
  onMemoryDeleted?: () => void
  currentUserId?: string
}

export function TinyPerfectMap({
  memories,
  favorites = [],
  height = "500px",
  personalMap = false,
  onMemoryDeleted,
  currentUserId,
}: TinyPerfectMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedMemories, setSelectedMemories] = useState<UserMemory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<UserMemory | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null)
  const [showSiteModal, setShowSiteModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isFullscreen])

  const handleImageError = (imageId: string) => {
    console.error(`Failed to load image: ${imageId}`)
    setImageErrors((prev) => new Set(prev).add(imageId))
  }

  const getImageUrl = (memoryId: string, imageId: string) => {
    return `/api/memories/${memoryId}/image/${imageId}`
  }

  const handleShowSiteDetails = async (siteId: string) => {
    if (!siteId) return

    try {
      const response = await fetch(`/api/cultural-sites/${siteId}`)
      if (response.ok) {
        const siteData = await response.json()
        setSelectedSite(siteData)
        setShowSiteModal(true)
      }
    } catch (error) {
      console.error("Error fetching site details:", error)
      toast.error("Failed to load site details")
    }
  }

  if (!isClient) {
    return (
      <div
        className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/10 rounded-lg flex items-center justify-center border border-emerald-200"
        style={{ height }}
      >
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <p className="text-emerald-600 dark:text-emerald-400">Loading magical moments...</p>
        </div>
      </div>
    )
  }

  // Group memories by location
  const memoryGroups = groupMemoriesByLocation(memories)

  // Filter favorites to exclude those that have memories at the same location
  const favoritesWithoutMemories = personalMap ? filterFavoritesWithoutMemories(favorites, memories) : []

  // Default center (Chemnitz)
  const defaultCenter: [number, number] = [50.8278, 12.9214]

  // Calculate center considering both memories and favorites
  const getAllPoints = () => {
    const points: [number, number][] = []

    // Add memory points
    memoryGroups.forEach((group) => {
      points.push([group.center.lat, group.center.lng])
    })

    // Add favorite points (only for personal maps)
    if (personalMap) {
      favoritesWithoutMemories.forEach((favorite) => {
        points.push([favorite.coordinates.lat, favorite.coordinates.lng])
      })
    }

    return points
  }

  const allPoints = getAllPoints()
  const center = allPoints.length > 0 ? (allPoints[0] as [number, number]) : defaultCenter

  const mapContainerClass = isFullscreen
    ? "fixed inset-0 z-[8000] bg-white dark:bg-gray-900"
    : "rounded-lg overflow-hidden z-40 border border-emerald-200 relative"

  const mapHeight = isFullscreen ? "100vh" : height

  return (
    <div className="relative">
      {isFullscreen ? (
        // Render fullscreen map as portal to document body
        typeof document !== "undefined" ? (
          ReactDOM.createPortal(
            <div className={mapContainerClass} style={{ height: mapHeight }}>
              <MapContainer
                center={center}
                zoom={memories.length > 0 ? 12 : 11}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
              >
                {/* All the map content */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Rest of map content stays the same */}
                {memoryGroups.map((group, groupIndex) => {
                  const isFavorited =
                    personalMap && group.memories.some((memory) => isMemoryLocationFavorited(memory, favorites))

                  return (
                    <Marker
                      key={groupIndex}
                      position={[group.center.lat, group.center.lng]}
                      icon={createMemoryIcon(group.memories.length, personalMap, isFavorited)}
                    >
                      <Popup className="memory-popup" maxWidth={400}>
                        <div className="p-2 min-w-[320px] max-w-[380px]">
                          {group.memories.length === 1 ? (
                            <SingleMemoryPopup
                              memory={group.memories[0]}
                              onViewDetails={() => setSelectedMemory(group.memories[0])}
                              imageErrors={imageErrors}
                              onImageError={handleImageError}
                              getImageUrl={getImageUrl}
                              isFavorited={isFavorited}
                            />
                          ) : (
                            <MultipleMemoriesPopup
                              memories={group.memories}
                              onViewAll={() => setSelectedMemories(group.memories)}
                              onViewSingle={(memory) => setSelectedMemory(memory)}
                              imageErrors={imageErrors}
                              onImageError={handleImageError}
                              getImageUrl={getImageUrl}
                              isFavorited={isFavorited}
                            />
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

                {personalMap &&
                  favoritesWithoutMemories.map((favorite) => (
                    <Marker
                      key={`favorite-${favorite.siteId}`}
                      position={[favorite.coordinates.lat, favorite.coordinates.lng]}
                      icon={createFavoriteIcon()}
                    >
                      <Popup className="favorite-popup" maxWidth={400}>
                        <div className="p-2 min-w-[320px] max-w-[380px]">
                          <FavoriteSitePopup
                            favorite={favorite}
                            onShowSiteDetails={() => handleShowSiteDetails(favorite.siteId)}
                          />
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                <MapBoundsAdjuster memories={memories} favorites={personalMap ? favorites : []} />
              </MapContainer>

              {/* Fullscreen controls */}
              <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                <Button
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 shadow-lg"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
                <div className="text-xs text-gray-500 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-md shadow-lg">
                  Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to exit
                </div>
              </div>
            </div>,
            document.body,
          )
        ) : null
      ) : (
        // Regular map container
        <div className={mapContainerClass} style={{ height: mapHeight }}>
          {/* All the existing map content */}
          <MapContainer
            center={center}
            zoom={memories.length > 0 ? 12 : 11}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {memoryGroups.map((group, groupIndex) => {
              const isFavorited =
                personalMap && group.memories.some((memory) => isMemoryLocationFavorited(memory, favorites))

              return (
                <Marker
                  key={groupIndex}
                  position={[group.center.lat, group.center.lng]}
                  icon={createMemoryIcon(group.memories.length, personalMap, isFavorited)}
                >
                  <Popup className="memory-popup" maxWidth={400}>
                    <div className="p-2 min-w-[320px] max-w-[380px]">
                      {group.memories.length === 1 ? (
                        <SingleMemoryPopup
                          memory={group.memories[0]}
                          onViewDetails={() => setSelectedMemory(group.memories[0])}
                          imageErrors={imageErrors}
                          onImageError={handleImageError}
                          getImageUrl={getImageUrl}
                          isFavorited={isFavorited}
                        />
                      ) : (
                        <MultipleMemoriesPopup
                          memories={group.memories}
                          onViewAll={() => setSelectedMemories(group.memories)}
                          onViewSingle={(memory) => setSelectedMemory(memory)}
                          imageErrors={imageErrors}
                          onImageError={handleImageError}
                          getImageUrl={getImageUrl}
                          isFavorited={isFavorited}
                        />
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            {personalMap &&
              favoritesWithoutMemories.map((favorite) => (
                <Marker
                  key={`favorite-${favorite.siteId}`}
                  position={[favorite.coordinates.lat, favorite.coordinates.lng]}
                  icon={createFavoriteIcon()}
                >
                  <Popup className="favorite-popup" maxWidth={400}>
                    <div className="p-2 min-w-[320px] max-w-[380px]">
                      <FavoriteSitePopup
                        favorite={favorite}
                        onShowSiteDetails={() => handleShowSiteDetails(favorite.siteId)}
                      />
                    </div>
                  </Popup>
                </Marker>
              ))}

            <MapBoundsAdjuster memories={memories} favorites={personalMap ? favorites : []} />
          </MapContainer>

          {/* Regular view controls */}
          {!isFullscreen && (
            <>
              {/* Floating stats */}
              <div className="absolute top-4 right-4 z-[1000]">
                <Card className="bg-white/90 dark:bg-black/80 backdrop-blur-sm border-emerald-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">{memories.length}</span>
                      <span className="text-muted-foreground">{personalMap ? "Memories" : "Perfect Moments"}</span>
                      {personalMap && favorites.length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium text-amber-600">{favoritesWithoutMemories.length}</span>
                          <span className="text-muted-foreground">Favorites</span>
                        </>
                      )}
                      {memoryGroups.length !== memories.length && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium">{memoryGroups.length}</span>
                          <span className="text-muted-foreground">locations</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Legend for personal maps */}
              {personalMap && (memories.length > 0 || favorites.length > 0) && (
                <div className="absolute bottom-4 left-4 z-[1000]">
                  <Card className="bg-white/90 dark:bg-black/80 backdrop-blur-sm border-emerald-200">
                    <CardContent className="p-3">
                      <div className="space-y-2 text-xs">
                        <div className="font-medium text-muted-foreground mb-2">Map Legend</div>
                        {memories.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs">
                              ✨
                            </div>
                            <span className="text-muted-foreground">Your Memories</span>
                          </div>
                        )}
                        {favoritesWithoutMemories.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs">
                              ❤️
                            </div>
                            <span className="text-muted-foreground">Favorite Sites</span>
                          </div>
                        )}
                        {memories.some((memory) => isMemoryLocationFavorited(memory, favorites)) && (
                          <div className="flex items-center gap-2">
                            <div className="relative w-4 h-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs">
                              ✨
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full text-xs">
                                ❤️
                              </div>
                            </div>
                            <span className="text-muted-foreground">Memory + Favorite</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Fullscreen toggle button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 z-[1000] bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Modals - these should render outside the map container */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          open={!!selectedMemory}
          onOpenChange={() => setSelectedMemory(null)}
          imageErrors={imageErrors}
          onImageError={handleImageError}
          currentUserId={currentUserId}
          onMemoryDeleted={onMemoryDeleted}
          onShowSiteDetails={() => handleShowSiteDetails(selectedMemory.siteId)}
          className={isFullscreen ? "z-[9000]" : ""}
        />
      )}

      {selectedMemories.length > 0 && (
        <MultipleMemoriesModal
          memories={selectedMemories}
          open={selectedMemories.length > 0}
          onOpenChange={() => setSelectedMemories([])}
          onSelectMemory={(memory) => {
            setSelectedMemories([])
            setSelectedMemory(memory)
          }}
          imageErrors={imageErrors}
          onImageError={handleImageError}
          getImageUrl={getImageUrl}
          className={isFullscreen ? "z-[9000]" : ""}
        />
      )}

      {selectedSite && (
        <SiteDetailsModal
          site={selectedSite}
          open={showSiteModal}
          onOpenChange={setShowSiteModal}
          className={isFullscreen ? "z-[9000]" : ""}
        />
      )}
    </div>
  )
}

// Single memory popup component
function SingleMemoryPopup({
  memory,
  onViewDetails,
  imageErrors,
  onImageError,
  getImageUrl,
  isFavorited = false,
}: {
  memory: UserMemory
  onViewDetails: () => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  getImageUrl: (memoryId: string, imageId: string) => string
  isFavorited?: boolean
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        {memory.images.length > 0 && (
          <div className="w-16 h-16 flex-shrink-0">
            {imageErrors.has(memory.images[0].id) ? (
              <div className="w-16 h-16 bg-muted rounded-lg border-2 border-emerald-200 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={getImageUrl(memory._id?.toString() || "", memory.images[0].id)}
                alt={memory.title || "Memory"}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg border-2 border-emerald-200"
                onError={() => onImageError(memory.images[0].id)}
                unoptimized
              />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {memory.title && (
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1 line-clamp-2 flex-1">
                {memory.title}
              </h4>
            )}
            {isFavorited && (
              <div className="flex-shrink-0">
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300"
                >
                  <Heart className="h-3 w-3 mr-1 fill-current" />
                  Favorite
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{memory.siteName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(memory.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">{memory.note}</p>

      {/* Tags */}
      {memory.tags && memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.tags.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"
            >
              {tag}
            </Badge>
          ))}
          {memory.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{memory.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {memory.images.length > 1 && <span>+{memory.images.length - 1} more photos</span>}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onViewDetails}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 bg-transparent"
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </div>
    </div>
  )
}

// Multiple memories popup component
function MultipleMemoriesPopup({
  memories,
  onViewAll,
  onViewSingle,
  imageErrors,
  onImageError,
  getImageUrl,
  isFavorited = false,
}: {
  memories: UserMemory[]
  onViewAll: () => void
  onViewSingle: (memory: UserMemory) => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  getImageUrl: (memoryId: string, imageId: string) => string
  isFavorited?: boolean
}) {
  const siteName = memories[0]?.siteName || "This location"

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-emerald-600" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
              {memories.length} Memories at {siteName}
            </h4>
            {isFavorited && (
              <Badge
                variant="outline"
                className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300"
              >
                <Heart className="h-3 w-3 mr-1 fill-current" />
                Favorite
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Multiple visitors shared their moments here</p>
        </div>
      </div>

      {/* Preview of first few memories */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {memories.slice(0, 3).map((memory) => (
          <div
            key={memory._id?.toString()}
            className="flex items-center gap-3 p-2 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
            onClick={() => onViewSingle(memory)}
          >
            {memory.images.length > 0 && (
              <div className="w-10 h-10 flex-shrink-0">
                {imageErrors.has(memory.images[0].id) ? (
                  <div className="w-10 h-10 bg-muted rounded border border-emerald-200 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <Image
                    src={getImageUrl(memory._id?.toString() || "", memory.images[0].id)}
                    alt={memory.title || "Memory"}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-cover rounded border border-emerald-200"
                    onError={() => onImageError(memory.images[0].id)}
                    unoptimized
                  />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {memory.title && (
                <p className="font-medium text-sm text-emerald-800 dark:text-emerald-200 line-clamp-1">
                  {memory.title}
                </p>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{memory.note}</p>
              <p className="text-xs text-muted-foreground">{new Date(memory.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onViewAll}
          className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 bg-transparent"
        >
          <Users className="h-3 w-3 mr-1" />
          View All {memories.length}
        </Button>
      </div>
    </div>
  )
}

// Multiple memories modal
function MultipleMemoriesModal({
  memories,
  open,
  onOpenChange,
  onSelectMemory,
  imageErrors,
  onImageError,
  getImageUrl,
  className,
}: {
  memories: UserMemory[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectMemory: (memory: UserMemory) => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  getImageUrl: (memoryId: string, imageId: string) => string
  className?: string
}) {
  const siteName = memories[0]?.siteName || "This location"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl max-h-[80vh] ${className || ""}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">
                {memories.length} Memories at {siteName}
              </h3>
              <p className="text-sm text-muted-foreground">Click on any memory to view details</p>
            </div>
          </div>

          {/* Memories grid */}
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
            {memories.map((memory) => (
              <Card
                key={memory._id?.toString()}
                className="overflow-hidden hover:shadow-md transition-all duration-300 border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-green-50/20 dark:from-emerald-950/10 dark:to-green-950/5 cursor-pointer"
                onClick={() => onSelectMemory(memory)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    {memory.images.length > 0 && (
                      <div className="flex-shrink-0">
                        {imageErrors.has(memory.images[0].id) ? (
                          <div className="w-20 h-20 bg-muted rounded-lg border-2 border-emerald-200 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <Image
                            src={getImageUrl(memory._id?.toString() || "", memory.images[0].id)}
                            alt={memory.title || "Memory"}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-emerald-200"
                            onError={() => onImageError(memory.images[0].id)}
                            unoptimized
                          />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {memory.title && (
                            <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">{memory.title}</h4>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{memory.note}</p>

                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {memory.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{memory.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component to adjust map bounds
function MapBoundsAdjuster({ memories, favorites = [] }: { memories: UserMemory[]; favorites?: UserFavorite[] }) {
  const map = useMap()

  useEffect(() => {
    const allPoints: [number, number][] = []

    // Add memory coordinates
    memories.forEach((memory) => {
      allPoints.push([memory.coordinates.lat, memory.coordinates.lng])
    })

    // Add favorite coordinates
    favorites.forEach((favorite) => {
      allPoints.push([favorite.coordinates.lat, favorite.coordinates.lng])
    })

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [memories, favorites, map])

  return null
}

// Memory Detail Modal Component (back to single panel)
function MemoryDetailModal({
  memory,
  open,
  onOpenChange,
  imageErrors,
  onImageError,
  currentUserId,
  onMemoryDeleted,
  onShowSiteDetails,
  isFavorited = false,
  className,
}: {
  memory: UserMemory
  open: boolean
  onOpenChange: (open: boolean) => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  currentUserId?: string
  onMemoryDeleted?: () => void
  onShowSiteDetails?: () => void
  isFavorited?: boolean
  className?: string
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: memory.title || "",
    images: memory.images.map((img) => img.id),
    note: memory.note,
    tags: memory.tags?.join(", ") || "",
    isPublic: memory.isPublic,
  })
  const [editImages, setEditImages] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [compressing, setCompressing] = useState(false)
  const [keptImageIds, setKeptImageIds] = useState<string[]>(memory.images.map((img) => img.id))

  // Reset form data when memory changes or editing starts
  useEffect(() => {
    if (isEditing) {
      setEditFormData({
        title: memory.title || "",
        images: memory.images.map((img) => img.id),
        note: memory.note,
        tags: memory.tags?.join(", ") || "",
        isPublic: memory.isPublic,
      })
      setKeptImageIds(memory.images.map((img) => img.id))
      setEditImages([])
      setEditImagePreviews([])
    }
  }, [isEditing, memory])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getImageUrl = (memoryId: string, imageId: string) => {
    return `/api/memories/${memoryId}/image/${imageId}`
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % memory.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + memory.images.length) % memory.images.length)
  }

  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new window.Image()

      img.onload = () => {
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length + editImages.length > 3) {
      toast.error("You can upload up to 3 images per memory")
      return
    }

    setCompressing(true)

    try {
      const processedFiles: File[] = []
      const newPreviews: string[] = []

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not a valid image file`)
          continue
        }

        try {
          const compressedFile = await compressImage(file, 1200, 1200, 0.8)

          if (compressedFile.size > 2 * 1024 * 1024) {
            const moreCompressed = await compressImage(file, 800, 800, 0.6)
            if (moreCompressed.size > 2 * 1024 * 1024) {
              toast.error(`${file.name} is still too large after compression`)
              continue
            }
            processedFiles.push(moreCompressed)
          } else {
            processedFiles.push(compressedFile)
          }

          const reader = new FileReader()
          reader.onload = (e) => {
            newPreviews.push(e.target?.result as string)
            if (newPreviews.length === processedFiles.length) {
              setEditImagePreviews((prev) => [...prev, ...newPreviews])
            }
          }
          reader.readAsDataURL(compressedFile)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
        }
      }

      if (processedFiles.length > 0) {
        setEditImages((prev) => [...prev, ...processedFiles])
      }
    } catch (error) {
      console.error("Error processing images:", error)
    } finally {
      setCompressing(false)
    }
  }

  const removeEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index))
    setEditImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }
  const handleUpdateMemory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editFormData.note.trim()) {
      toast.error("Please write a note about your experience")
      return
    }

    // Ensure at least one image remains
    if (keptImageIds.length === 0 && editImages.length === 0) {
      toast.error("At least one image is required for a memory")
      return
    }

    setIsUpdating(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("title", editFormData.title)
      formDataToSend.append("note", editFormData.note)
      formDataToSend.append("isPublic", editFormData.isPublic.toString())
      formDataToSend.append("tags", editFormData.tags)      // Send kept image IDs so backend knows which to keep
      formDataToSend.append("keptImageIds", JSON.stringify(keptImageIds))
      console.log("Kept image IDs:", keptImageIds)
      console.log("New images count:", editImages.length)
      // Add new images if any
      editImages.forEach((image) => {
        formDataToSend.append("images", image)
      })

      const response = await fetch(`/api/memories/${memory._id}`, {
        method: "PUT",
        body: formDataToSend,
      })

      if (response.ok) {
        toast.success("Memory updated successfully")
        setIsEditing(false)
        onMemoryDeleted?.() // This will refresh the memories list
        onOpenChange(false) // Close the modal
      } else {
        // --- Fix: Check content type before parsing as JSON ---
        const contentType = response.headers.get("content-type") || ""
        let errorMsg = "Failed to update memory"
        if (contentType.includes("application/json")) {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } else {
          const text = await response.text()
          if (text) errorMsg = text
        }
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error("Error updating memory:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update memory")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!memory._id) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/memories/${memory._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Memory deleted successfully")
        onMemoryDeleted?.()
        onOpenChange(false)
      } else {
        throw new Error("Failed to delete memory")
      }
    } catch (error) {
      console.error("Error deleting memory:", error)
      toast.error("Failed to delete memory")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Check if current user owns this memory
  const canDelete = currentUserId && memory.userId === currentUserId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-4xl max-h-[90vh] p-0 ${className || ""}`}>
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 pb-4 border-b">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                {memory.title && (
                  <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 flex-1">
                    {memory.title}
                  </h3>
                )}
                {isFavorited && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300"
                  >
                    <Heart className="h-4 w-4 mr-1 fill-current" />
                    Also Favorited
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {memory.siteName}
                  </div>
                </div>
                <div className="flex gap-2">
                  {onShowSiteDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowSiteDetails}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent"
                    >
                      <Info className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                  {canDelete && (
                    <>
                      {!isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 mr-1" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>                          <Button
                            size="sm"
                            onClick={handleUpdateMemory}
                            disabled={isUpdating || !editFormData.note.trim() || (keptImageIds.length === 0 && editImages.length === 0)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {isUpdating ? "Saving..." : "Save"}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          {memory.images.length > 0 && !isEditing && (
            <div className="relative flex-1 min-h-0 bg-black/5 dark:bg-black/20">
              <div className="relative h-full flex items-center justify-center p-4">
                {imageErrors.has(memory.images[currentImageIndex].id) ? (
                  <div className="w-full max-w-2xl h-96 bg-muted rounded-lg border-2 border-emerald-200 flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Failed to load image</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={getImageUrl(memory._id?.toString() || "", memory.images[currentImageIndex].id)}
                      alt={memory.title || "Memory"}
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      onError={() => onImageError(memory.images[currentImageIndex].id)}
                      unoptimized
                      priority
                    />
                  </div>
                )}

                {/* Navigation arrows for multiple images */}
                {memory.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90 shadow-lg"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90 shadow-lg"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>

                    {/* Image counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {memory.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail navigation for multiple images */}
              {memory.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 dark:bg-black/90 p-2 rounded-lg shadow-lg max-w-[calc(100%-2rem)] overflow-x-auto">
                  {memory.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                        index === currentImageIndex
                          ? "border-emerald-400 ring-2 ring-emerald-200"
                          : "border-emerald-200 hover:border-emerald-300"
                      }`}
                    >
                      {imageErrors.has(memory.images[index].id) ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <Image
                          src={getImageUrl(memory._id?.toString() || "", memory.images[index].id)}
                          alt={`Thumbnail ${index + 1}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={() => onImageError(memory.images[index].id)}
                          unoptimized
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
          <div className="p-6 pt-4 space-y-4">
            {!isEditing ? (
              <>
                {/* View Mode - Note */}
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{memory.note}</p>
                </div>

                {/* View Mode - Tags */}
                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {memory.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Edit Mode Form */}
                <ScrollArea className="h-[400px] pr-4">
                  <form onSubmit={handleUpdateMemory} className="space-y-6">
                    {/* New & Existing Images Preview/Remove */}                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Add or Remove Photos</Label>
                        <span className="text-xs text-muted-foreground">
                          {keptImageIds.length + editImages.length} of 3 photos
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Existing images from DB */}
                        {memory.images
                          .filter((img) => keptImageIds.includes(img.id))
                          .map((img, index) => (
                            <div key={img.id} className="relative group">
                              <Image
                                src={getImageUrl(memory._id?.toString() || '', img.id)}
                                alt={`Existing image ${index + 1}`}
                                width={200}
                                height={96}
                                className="w-full h-24 object-cover rounded-lg border-2 border-emerald-200"
                                unoptimized
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"                                onClick={() => {
                                  // Only allow removal if there will be at least one image left (existing + new)
                                  const totalImagesAfterRemoval = (keptImageIds.length - 1) + editImages.length
                                  if (totalImagesAfterRemoval > 0) {
                                    setKeptImageIds((prev) => prev.filter((id) => id !== img.id))
                                  } else {
                                    toast.error("At least one image is required for a memory")
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                                Existing
                              </div>
                            </div>
                          ))}
                        {/* New images to upload */}
                        {editImagePreviews.map((preview, index) => (
                          <div key={preview} className="relative group">
                            <Image
                              src={preview || "/placeholder.svg"}
                              alt={`New preview ${index + 1}`}
                              width={200}
                              height={96}
                              className="w-full h-24 object-cover rounded-lg border-2 border-emerald-200"
                              unoptimized
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeEditImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                              {(editImages[index]?.size / 1024).toFixed(0)}KB
                            </div>
                          </div>
                        ))}
                        {/* Add button if less than 3 total images */}
                        {keptImageIds.length + editImages.length < 3 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={compressing}
                            className="h-24 border-2 border-dashed border-emerald-300 rounded-lg flex flex-col items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors disabled:opacity-50"
                          >
                            {compressing ? (
                              <>
                                <Loader2 className="h-5 w-5 mb-1 animate-spin" />
                                <span className="text-xs">Processing...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 mb-1" />
                                <span className="text-xs">Add Photo</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-title" className="text-sm font-medium">
                        Title <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="edit-title"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="A perfect moment at..."
                        maxLength={50}
                        className="border-emerald-200 focus:border-emerald-400"
                      />
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-note" className="text-sm font-medium">
                        Your reflection <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="edit-note"
                        value={editFormData.note}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="What made this moment special? Share your thoughts, feelings, or what caught your attention..."
                        maxLength={300}
                        rows={4}
                        className="border-emerald-200 focus:border-emerald-400 resize-none"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Share your experience in your own words</span>
                        <span>{editFormData.note.length}/300</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-tags" className="text-sm font-medium">
                        Tags <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="edit-tags"
                        value={editFormData.tags}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="peaceful, inspiring, beautiful..."
                        className="border-emerald-200 focus:border-emerald-400"
                      />
                      <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                    </div>

                    {/* Privacy */}
                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-emerald-200">
                      <div className="space-y-1">
                        <Label htmlFor="edit-isPublic" className="text-sm font-medium">
                          Share on the Map of Tiny Perfect Things
                        </Label>
                        <p className="text-xs text-muted-foreground">Let others discover your beautiful moment</p>
                      </div>
                      <Switch
                        id="edit-isPublic"
                        checked={editFormData.isPublic}
                        onCheckedChange={(checked) => setEditFormData((prev) => ({ ...prev, isPublic: checked }))}
                      />
                    </div>
                  </form>
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h4 className="font-semibold">Delete Memory?</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This action cannot be undone. Your memory and all its images will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Favorite site popup component
function FavoriteSitePopup({
  favorite,
  onShowSiteDetails,
}: {
  favorite: UserFavorite
  onShowSiteDetails: () => void
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-amber-200 flex items-center justify-center">
          <Heart className="h-8 w-8 text-amber-600 fill-current" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1 line-clamp-2">{favorite.siteName}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{favorite.category}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Added {new Date(favorite.dateAdded).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">{favorite.description}</p>

      {/* Category Badge */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant="outline"
          className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300"
        >
          {favorite.category}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Heart className="h-3 w-3 text-amber-500 fill-current" />
          <span>Favorite Site</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onShowSiteDetails}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-amber-200 bg-transparent"
        >
          <Eye className="h-3 w-3 mr-1" />
          View Details
        </Button>
      </div>
    </div>
  )
}

export default TinyPerfectMap
