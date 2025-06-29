import { NextResponse } from "next/server"
import { MemoryService } from "@/lib/memory-service"

/**
 * @swagger
 * /api/memories/{id}/image/{imageId}:
 *   get:
 *     summary: Get a memory image
 *     description: Retrieve a specific image from a memory by ID. Returns raw image data with appropriate Content-Type header, caching headers, and CORS support.
 *     tags: [Memories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Memory ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID within the memory
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Type:
 *             description: Image MIME type
 *             schema:
 *               type: string
 *               example: "image/jpeg"
 *           Content-Length:
 *             description: Image size in bytes
 *             schema:
 *               type: integer
 *           Cache-Control:
 *             description: Caching directives
 *             schema:
 *               type: string
 *               example: "public, max-age=31536000, immutable"
 *       404:
 *         description: Memory or image not found
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

type MongoBuffer = { type: "Buffer"; data: number[] }
function isMongoBuffer(obj: unknown): obj is MongoBuffer {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj as MongoBuffer).type === "Buffer" &&
    Array.isArray((obj as MongoBuffer).data)
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    // Await the params Promise
    const { id, imageId } = await params

    console.log(`Serving image: memoryId=${id}, imageId=${imageId}`) // Debug log

    const memory = await MemoryService.getMemoryById(id)

    if (!memory) {
      console.log(`Memory not found: ${id}`)
      return NextResponse.json({ error: "Memory not found", code: "NOT_FOUND" }, { status: 404 })
    }

    console.log(`Memory found with ${memory.images.length} images`) // Debug log

    const image = memory.images.find((img) => img.id === imageId)

    if (!image) {
      console.log(`Image not found: ${imageId} in memory ${id}`)
      console.log(
        `Available images:`,
        memory.images.map((img) => ({ id: img.id, filename: img.filename })),
      )
      return NextResponse.json({ error: "Image not found", code: "NOT_FOUND" }, { status: 404 })
    }

    console.log(`Found image: ${image.filename}, type: ${image.mimeType}, size: ${image.size}`)
    console.log(`Image data type: ${typeof image.data}, isBuffer: ${Buffer.isBuffer(image.data)}`)

    // Handle different data formats that might be stored in MongoDB
    let imageBuffer: Buffer

    if (Buffer.isBuffer(image.data)) {
      imageBuffer = image.data
    } else if (isMongoBuffer(image.data)) {
      // MongoDB sometimes stores buffers as { type: 'Buffer', data: [array of bytes] }
      imageBuffer = Buffer.from(image.data.data)
    } else if (typeof image.data === "string") {
      // If stored as base64 string
      imageBuffer = Buffer.from(image.data, "base64")
    } else {
      console.log(`Invalid image data format:`, typeof image.data, image.data)
      return NextResponse.json({ error: "Invalid image data format", code: "INVALID_DATA" }, { status: 500 })
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      console.log(`Empty image buffer for ${imageId}`)
      return NextResponse.json({ error: "Empty image data", code: "INVALID_DATA" }, { status: 500 })
    }

    console.log(`Serving buffer of size: ${imageBuffer.length}`)

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })  } catch (error) {
    console.error("Error serving image:", error)
    return NextResponse.json({ error: "Internal Server Error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
