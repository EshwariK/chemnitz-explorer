"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sparkles, Calendar, Eye, MapPin, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import type { UserMemory } from "@/lib/memory-service"
import Image from "next/image"

// Fix for default markers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Create magical memory marker
const createMemoryIcon = (isPersonal = false) => {
  const color = isPersonal ? "#ec4899" : "#10b981" // Pink for personal, emerald for public
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
          ">
            ✨
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

  // Default center (Chemnitz)
  const defaultCenter: [number, number] = [50.8278, 12.9214]
  const center =
    memories.length > 0
      ? ([memories[0].coordinates.lat, memories[0].coordinates.lng] as [number, number])
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

          {/* Memory markers */}
          {memories.map((memory) => (
            <Marker
              key={memory._id?.toString()}
              position={[memory.coordinates.lat, memory.coordinates.lng]}
              icon={createMemoryIcon(personalMap)}
            >
              <Popup className="memory-popup">
                <div className="p-2 min-w-[280px] max-w-[320px]">
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
                              onError={() => handleImageError(memory.images[0].id)}
                              unoptimized
                            />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {memory.title && (
                          <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1 line-clamp-2">
                            {memory.title}
                          </h4>
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
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                      {memory.note}
                    </p>

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
                        onClick={() => setSelectedMemory(memory)}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          open={!!selectedMemory}
          onOpenChange={() => setSelectedMemory(null)}
          imageErrors={imageErrors}
          onImageError={handleImageError}
        />
      )}
    </div>
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
