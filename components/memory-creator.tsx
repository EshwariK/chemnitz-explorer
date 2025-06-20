"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Camera, Upload, X, Loader2, Sparkles, Heart, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"
import type { CulturalSite } from "@/lib/cultural-sites-service"
import Image from "next/image"

interface MemoryCreatorProps {
  site: CulturalSite
  onMemoryCreated?: () => void
}

// Image compression utility
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new window.Image()

    img.onload = () => {
      // Calculate new dimensions
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

      // Draw and compress
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

export function MemoryCreator({ site, onMemoryCreated }: MemoryCreatorProps) {
  const { data: session } = useSession()
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    note: "",
    isPublic: true,
    tags: "",
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length + selectedImages.length > 3) {
      toast.warning("You can upload up to 3 images per memory")
      return
    }

    setCompressing(true)

    try {
      const processedFiles: File[] = []
      const newPreviews: string[] = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.warning(`${file.name} is not a valid image file`)
          continue
        }

        // Check original file size (warn if very large)
        if (file.size > 10 * 1024 * 1024) {
          // 10MB
          toast.warning(`${file.name} is very large and will be compressed`)
        }

        try {
          // Compress the image
          const compressedFile = await compressImage(file, 1200, 1200, 0.8)

          // Final size check after compression
          if (compressedFile.size > 2 * 1024 * 1024) {
            // 2MB
            // Try more aggressive compression
            const moreCompressed = await compressImage(file, 800, 800, 0.6)
            if (moreCompressed.size > 2 * 1024 * 1024) {
              toast.warning(`${file.name} is still too large after compression. Please use a smaller image.`)
              continue
            }
            processedFiles.push(moreCompressed)
          } else {
            processedFiles.push(compressedFile)
          }

          // Create preview
          const reader = new FileReader()
          reader.onload = (e) => {
            newPreviews.push(e.target?.result as string)
            if (newPreviews.length === processedFiles.length) {
              setImagePreviews((prev) => [...prev, ...newPreviews])
            }
          }
          reader.readAsDataURL(compressedFile)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
          toast.error(`Failed to process ${file.name}`)
        }
      }

      if (processedFiles.length > 0) {
        setSelectedImages((prev) => [...prev, ...processedFiles])
        toast.success(`${processedFiles.length} image(s) processed and compressed`)
      }
    } catch (error) {
      console.error("Error processing images:", error)
      toast.error("Failed to process images")
    } finally {
      setCompressing(false)
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.note.trim()) {
      toast.error("Please write a note about your experience")
      return
    }

    if (selectedImages.length === 0) {
      toast.error("Please add at least one image to your memory")
      return
    }

    // Check total payload size
    const totalSize = selectedImages.reduce((sum, file) => sum + file.size, 0)
    const estimatedPayloadSize = totalSize + 50000 // Add overhead for other form data

    if (estimatedPayloadSize > 4.5 * 1024 * 1024) {
      // 4.5MB limit (conservative)
      toast.error("Total image size is too large. Please remove some images or use smaller ones.")
      return
    }

    setIsCreating(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("siteId", site._id?.toString() || "")
      formDataToSend.append("siteName", site.name)
      formDataToSend.append("siteCategory", site.category)
      formDataToSend.append("lat", site.coordinates.lat.toString())
      formDataToSend.append("lng", site.coordinates.lng.toString())
      formDataToSend.append("title", formData.title)
      formDataToSend.append("note", formData.note)
      formDataToSend.append("isPublic", formData.isPublic.toString())
      formDataToSend.append("tags", formData.tags)

      selectedImages.forEach((image) => {
        formDataToSend.append("images", image)
      })

      const response = await fetch("/api/memories", {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        toast.success("Your tiny perfect moment has been captured")

        // Reset form
        setFormData({ title: "", note: "", isPublic: true, tags: "" })
        setSelectedImages([])
        setImagePreviews([])
        setShowForm(false)
        onMemoryCreated?.()
      } else {
        const errorData = await response.json()
        if (response.status === 413 || errorData.error?.includes("too large")) {
          toast.error("Images are too large. Please use smaller images or reduce the number of images.")
        } else {
          throw new Error(errorData.error || "Failed to create memory")
        }
      }
    } catch (error) {
      console.error("Error creating memory:", error)
      if (error instanceof Error && error.message.includes("413")) {
        toast.error("Images are too large for upload. Please use smaller images.")
      } else {
        toast.error("Failed to create memory. Please try again.")
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (!session) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">Capture your tiny perfect moment</p>
          <p className="text-sm text-muted-foreground">Sign in to share your memories of this place</p>
        </CardContent>
      </Card>
    )
  }

  if (!showForm) {
    return (
      <Card className="border-dashed border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10 hover:shadow-md transition-all duration-300">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="relative mb-4">
            <Camera className="h-8 w-8 text-emerald-600" />
            <Sparkles className="h-4 w-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Create a Tiny Perfect Memory</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4 max-w-sm">
            Share a photo and reflection from your visit to {site.name}
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Heart className="h-4 w-4 mr-2" />
            Capture This Moment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
          <Sparkles className="h-5 w-5" />
          Your Tiny Perfect Memory
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Photos</Label>

            {/* Size warning */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Images will be automatically compressed to ensure fast upload. Maximum 3 images, 2MB each after
                compression.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
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
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {/* Show file size */}
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                    {(selectedImages[index]?.size / 1024).toFixed(0)}KB
                  </div>
                </div>
              ))}

              {selectedImages.length < 3 && (
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
            <p className="text-xs text-muted-foreground">
              Upload up to 3 images. Large images will be automatically compressed for faster upload.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="A perfect moment at..."
              maxLength={50}
              className="border-emerald-200 focus:border-emerald-400"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium">
              Your reflection <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="What made this moment special? Share your thoughts, feelings, or what caught your attention..."
              maxLength={300}
              rows={4}
              className="border-emerald-200 focus:border-emerald-400 resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Share your experience in your own words</span>
              <span>{formData.note.length}/300</span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="peaceful, inspiring, beautiful..."
              className="border-emerald-200 focus:border-emerald-400"
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas</p>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-emerald-200">
            <div className="space-y-1">
              <Label htmlFor="isPublic" className="text-sm font-medium">
                Share on the Map of Tiny Perfect Things
              </Label>
              <p className="text-xs text-muted-foreground">Let others discover your beautiful moment</p>
            </div>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.note.trim() || selectedImages.length === 0 || compressing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Memory
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
