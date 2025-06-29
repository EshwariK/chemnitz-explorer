import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { MemoryService } from "@/lib/memory-service"
import { authOptions } from "@/lib/auth-options"
import type { UserMemory } from "@/lib/memory-service"

/**
 * @swagger
 * /api/memories/{id}:
 *   get:
 *     summary: Get a specific memory by ID
 *     tags: [Memories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Memory ID
 *     responses:
 *       200:
 *         description: Memory details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Memory'
 *       404:
 *         description: Memory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update a memory
 *     tags: [Memories]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Memory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               note:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Memory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Memory not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a memory
 *     tags: [Memories]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Memory ID
 *     responses:
 *       200:
 *         description: Memory deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Memory not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const memory = await MemoryService.getMemoryById(id)

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    return NextResponse.json(memory)
  } catch (error) {
    console.error("Error fetching memory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const contentType = request.headers.get("content-type") || ""
    let updates: Partial<UserMemory> = {}
    const newImages: Array<{
      id: string
      filename: string
      originalName: string
      mimeType: string
      size: number
      data: Buffer
    }> = []
    let keptImageIds: string[] = []

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      
      // Extract basic fields
      updates.title = formData.get("title")?.toString() || ""
      updates.note = formData.get("note")?.toString() || ""
      updates.isPublic = formData.get("isPublic") === "true"
      updates.tags = (formData.get("tags")?.toString() || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      
      // Extract kept image IDs
      const keptImageIdsStr = formData.get("keptImageIds")?.toString()
      if (keptImageIdsStr) {
        try {
          keptImageIds = JSON.parse(keptImageIdsStr)
        } catch (e) {
          console.error("Error parsing keptImageIds:", e)
          keptImageIds = []
        }
      }
      
      // Extract new image files
      const files = formData.getAll("images").filter((f) => f instanceof File) as File[]
      console.log(`Processing ${files.length} new files, keeping ${keptImageIds.length} existing images`)

      // Check total size before processing
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      if (totalSize > 6 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: "Total image size too large. Please use smaller images or reduce the number of images.",
          },
          { status: 413 },
        )
      }

      // Process new image files
      for (const file of files) {
        if (file.size > 0) {
          console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)

          if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
              {
                error: `Image ${file.name} is too large. Please compress it to under 2MB.`,
              },
              { status: 413 },
            )
          }

          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          newImages.push({
            id: crypto.randomUUID(),
            filename: `${Date.now()}-${file.name}`,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            data: buffer,
          })
        }
      }

      console.log(`Created ${newImages.length} new image objects`)

      // Final payload size check
      const totalBufferSize = newImages.reduce((sum, img) => sum + img.data.length, 0)
      if (totalBufferSize > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: "Images are too large for processing. Please use smaller images.",
          },
          { status: 413 },
        )
      }

    } else if (contentType.includes("application/json")) {
      updates = await request.json()
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 })
    }

    // Pass the additional parameters for image handling
    const success = await MemoryService.updateMemory(id, session.user.id, updates, {
      keptImageIds,
      newImages
    })

    if (!success) {
      return NextResponse.json({ error: "Memory not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Memory updated successfully" })
  } catch (error) {
    console.error("Error updating memory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const success = await MemoryService.deleteMemory(id, session.user.id)

    if (!success) {
      return NextResponse.json({ error: "Memory not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Memory deleted successfully" })
  } catch (error) {
    console.error("Error deleting memory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
