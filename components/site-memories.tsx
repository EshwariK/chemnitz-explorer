"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2, Sparkles, Calendar, User, Eye, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import type { CulturalSite } from "@/lib/cultural-sites-service"
import type { UserMemory } from "@/lib/memory-service"
import Image from "next/image"
import { useSession } from "next-auth/react"

interface SiteMemoriesProps {
  site: CulturalSite
}

export function SiteMemories({ site }: SiteMemoriesProps) {
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMemory, setSelectedMemory] = useState<UserMemory | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const { data: session } = useSession()

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const response = await fetch(`/api/memories?siteId=${site._id}&public=true`)
        if (response.ok) {
          const data = await response.json()
          console.log("Fetched memories:", data) // Debug log
          setMemories(data)
        }
      } catch (error) {
        console.error("Error fetching memories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMemories()
  }, [site._id])

  const handleImageError = (imageId: string) => {
    console.error(`Failed to load image: ${imageId}`)
    setImageErrors((prev) => new Set(prev).add(imageId))
  }

  const getImageUrl = (memoryId: string, imageId: string) => {
    return `/api/memories/${memoryId}/image/${imageId}`
  }

  const refreshMemories = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/memories?siteId=${site._id}&public=true`)
      if (response.ok) {
        const data = await response.json()
        setMemories(data)
      }
    } catch (error) {
      console.error("Error refreshing memories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No memories yet</h3>
        <p className="text-muted-foreground">Be the first to share a tiny perfect moment from this place</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-emerald-500" />
        <h3 className="text-lg font-semibold">Tiny Perfect Moments ({memories.length})</h3>
      </div>

      <div className="grid gap-4">
        {memories.map((memory) => (
          <Card
            key={memory._id?.toString()}
            className="overflow-hidden hover:shadow-md transition-all duration-300 border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-green-50/20 dark:from-emerald-950/10 dark:to-green-950/5"
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
                        onError={() => handleImageError(memory.images[0].id)}
                        unoptimized // Add this to bypass Next.js image optimization for our custom API
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
                        <User className="h-3 w-3 ml-2" />
                        Anonymous Explorer
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{memory.note}</p>

                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {memory.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {memory.images.length > 1 && (
                        <span className="text-xs text-muted-foreground">+{memory.images.length - 1} more photos</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMemory(memory)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          open={!!selectedMemory}
          onOpenChange={() => setSelectedMemory(null)}
          imageErrors={imageErrors}
          onImageError={handleImageError}
          currentUserId={session?.user?.id}
          onMemoryDeleted={refreshMemories}
        />
      )}
    </div>
  )
}

// Memory Detail Modal Component
function MemoryDetailModal({
  memory,
  open,
  onOpenChange,
  imageErrors,
  onImageError,
  currentUserId,
  onMemoryDeleted,
}: {
  memory: UserMemory
  open: boolean
  onOpenChange: (open: boolean) => void
  imageErrors: Set<string>
  onImageError: (imageId: string) => void
  currentUserId?: string
  onMemoryDeleted: () => void
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

  const handleDeleteMemory = async () => {
    if (!memory._id) {
      console.error("Memory ID is missing, cannot delete.")
      return
    }

    try {
      const response = await fetch(`/api/memories/${memory._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        console.log("Memory deleted successfully.")
        onOpenChange(false) // Close the modal
        onMemoryDeleted() // Refresh the memories list
      } else {
        console.error("Failed to delete memory:", response.statusText)
        // Optionally, display an error message to the user
      }
    } catch (error) {
      console.error("Error deleting memory:", error)
      // Optionally, display an error message to the user
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
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
                    <User className="h-4 w-4" />
                    Anonymous Explorer
                  </div>
                </div>
              </div>
              {currentUserId === memory.userId && (
                <Button variant="destructive" size="sm" onClick={handleDeleteMemory}>
                  Delete
                </Button>
              )}
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
