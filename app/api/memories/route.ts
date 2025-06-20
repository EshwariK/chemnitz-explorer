import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { MemoryService } from "@/lib/memory-service"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const siteId = searchParams.get("siteId")
  const publicOnly = searchParams.get("public") === "true"

  try {
    if (userId) {
      const memories = await MemoryService.getUserMemories(userId)
      return NextResponse.json(memories)
    } else if (siteId) {
      const memories = await MemoryService.getSiteMemories(siteId, !publicOnly)
      return NextResponse.json(memories)
    } else if (publicOnly) {
      const memories = await MemoryService.getPublicMemories()
      return NextResponse.json(memories)
    } else {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching memories:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const siteId = formData.get("siteId") as string
    const siteName = formData.get("siteName") as string
    const siteCategory = formData.get("siteCategory") as string
    const lat = Number.parseFloat(formData.get("lat") as string)
    const lng = Number.parseFloat(formData.get("lng") as string)
    const title = formData.get("title") as string
    const note = formData.get("note") as string
    const isPublic = formData.get("isPublic") === "true"
    const tags = formData.get("tags") ? (formData.get("tags") as string).split(",").map((t) => t.trim()) : []

    if (!siteId || !siteName || !note || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Process uploaded images
    const images = []
    const files = formData.getAll("images") as File[]

    console.log(`Processing ${files.length} files`) // Debug log

    // Check total size before processing
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 6 * 1024 * 1024) {
      // 6MB total limit
      return NextResponse.json(
        {
          error: "Total image size too large. Please use smaller images or reduce the number of images.",
        },
        { status: 413 },
      )
    }

    for (const file of files) {
      if (file.size > 0) {
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`) // Debug log

        // Individual file size check
        if (file.size > 2 * 1024 * 1024) {
          // 2MB per file
          return NextResponse.json(
            {
              error: `Image ${file.name} is too large. Please compress it to under 2MB.`,
            },
            { status: 413 },
          )
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log(`Created buffer of size: ${buffer.length}`) // Debug log

        images.push({
          id: crypto.randomUUID(),
          filename: `${Date.now()}-${file.name}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          data: buffer,
        })
      }
    }

    console.log(`Created ${images.length} image objects`) // Debug log

    if (images.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
    }

    // Final payload size check
    const totalBufferSize = images.reduce((sum, img) => sum + img.data.length, 0)
    if (totalBufferSize > 5 * 1024 * 1024) {
      // 5MB buffer limit
      return NextResponse.json(
        {
          error: "Images are too large for processing. Please use smaller images.",
        },
        { status: 413 },
      )
    }

    const memoryData = {
      userId: session.user.id,
      siteId,
      siteName,
      siteCategory,
      coordinates: { lat, lng },
      title: title || undefined,
      note,
      images,
      tags,
      isPublic,
    }

    const memoryId = await MemoryService.createMemory(memoryData)

    return NextResponse.json({
      success: true,
      memoryId: memoryId.toString(),
      message: "Memory created successfully",
    })
  } catch (error) {
    console.error("Error creating memory:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("too large") || error.message.includes("413")) {
        return NextResponse.json(
          {
            error: "Request too large. Please use smaller images.",
          },
          { status: 413 },
        )
      }
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
