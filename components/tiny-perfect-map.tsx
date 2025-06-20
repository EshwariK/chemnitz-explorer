"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sparkles, Calendar, Eye, MapPin, AlertCircle, ChevronLeft, ChevronRight, Users } from "lucide-react"
import type { UserMemory } from "@/lib/memory-service"
import Image from "next/image"

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

// Create magical memory marker with count
const createMemoryIcon = (count: number, isPersonal = false) => {
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

interface TinyPerfectMapProps {
  memories: UserMemory[]
  height?: string
  showUserLocation?: boolean
  personalMap?: boolean
}

export function TinyPerfectMap({ memories, height = "500px", personalMap = false }: TinyPerfectMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedMemories, setSelectedMemories] = useState<UserMemory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<UserMemory | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleImageError = (imageId: string) => {
    console.error(`Failed to load image: ${imageId}`)
    setImageErrors((prev) => new Set(prev).add(imageId))
  }

  const getImageUrl = (memoryId: string, imageId: string) => {
    return `/api/memories/${memoryId}/image/${imageId}`
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

  // Default center (Chemnitz)
  const defaultCenter: [number, number] = [50.8278, 12.9214]
  const center =
    memoryGroups.length > 0
      ? ([memoryGroups[0].center.lat, memoryGroups[0].center.lng] as [number, number])
      : defaultCenter

  return (
    <div className="relative">
      <div className="rounded-lg overflow-hidden z-40 border border-emerald-200 relative" style={{ height }}>
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

          {/* Memory group markers */}
          {memoryGroups.map((group, groupIndex) => (
            <Marker
              key={groupIndex}
              position={[group.center.lat, group.center.lng]}
              icon={createMemoryIcon(group.memories.length, personalMap)}
            >
              <Popup className="memory-popup" maxWidth={400}>
                <div className="p-2 min-w-[320px] max-w-[380px]">
                  {group.memories.length === 1 ? (
                    // Single memory popup
                    <SingleMemoryPopup
                      memory={group.memories[0]}
                      onViewDetails={() => setSelectedMemory(group.memories[0])}
                      imageErrors={imageErrors}
                      onImageError={handleImageError}
                      getImageUrl={getImageUrl}
                    />
                  ) : (
                    // Multiple memories popup
                    <MultipleMemoriesPopup
                      memories={group.memories}
                      onViewAll={() => setSelectedMemories(group.memories)}
                      onViewSingle={(memory) => setSelectedMemory(memory)}
                      imageErrors={imageErrors}
                      onImageError={handleImageError}
                      getImageUrl={getImageUrl}
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Map bounds adjuster */}
          <MapBoundsAdjuster memories={memories} />
        </MapContainer>

        {/* Floating stats */}
        <div className="absolute top-4 right-4 z-[1000]">
          <Card className="bg-white/90 dark:bg-black/80 backdrop-blur-sm border-emerald-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{memories.length}</span>
                <span className="text-muted-foreground">{personalMap ? "Your Memories" : "Perfect Moments"}</span>
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
      </div>

      {/* Single Memory Detail Modal */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          open={!!selectedMemory}
          onOpenChange={() => setSelectedMemory(null)}
          imageErrors={imageErrors}
          onImageError={handleImageError}
        />
      )}

      {/* Multiple Memories Modal */}
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
}: {
  memory: UserMemory
  onViewDetails: () => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  getImageUrl: (memoryId: string, imageId: string) => string
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
          {memory.title && (
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1 line-clamp-2">{memory.title}</h4>
          )}
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
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200"
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
}: {
  memories: UserMemory[]
  onViewAll: () => void
  onViewSingle: (memory: UserMemory) => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  getImageUrl: (memoryId: string, imageId: string) => string
}) {
  const siteName = memories[0]?.siteName || "This location"

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-emerald-600" />
        <div>
          <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
            {memories.length} Memories at {siteName}
          </h4>
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
          className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200"
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
}: {
  memories: UserMemory[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectMemory: (memory: UserMemory) => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  getImageUrl: (memoryId: string, imageId: string) => string
}) {
  const siteName = memories[0]?.siteName || "This location"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
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
function MapBoundsAdjuster({ memories }: { memories: UserMemory[] }) {
  const map = useMap()

  useEffect(() => {
    if (memories.length > 0) {
      const bounds = L.latLngBounds(memories.map((memory) => [memory.coordinates.lat, memory.coordinates.lng]))
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [memories, map])

  return null
}

// Memory Detail Modal Component
function MemoryDetailModal({
  memory,
  open,
  onOpenChange,
  imageErrors,
  onImageError,
}: {
  memory: UserMemory
  open: boolean
  onOpenChange: (open: boolean) => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const getImageUrl = (memoryId: string, imageId: string) => {
    return `/api/memories/${memoryId}/image/${imageId}`
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % memory.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + memory.images.length) % memory.images.length)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 pb-4 border-b">
            <div className="space-y-2">
              {memory.title && (
                <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">{memory.title}</h3>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(memory.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {memory.siteName}
                </div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          {memory.images.length > 0 && (
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
            {/* Note */}
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{memory.note}</p>
            </div>

            {/* Tags */}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TinyPerfectMap
