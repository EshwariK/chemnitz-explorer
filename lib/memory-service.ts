import clientPromise from "./mongodb"
import { ObjectId, Binary } from "mongodb"

export interface UserMemory {
  _id?: ObjectId
  userId: string
  siteId: string
  siteName: string
  siteCategory: string
  coordinates: {
    lat: number
    lng: number
  }
  title?: string
  note: string
  images: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    data: Buffer | Binary // Allow both Buffer and MongoDB Binary
  }>
  tags?: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MemoryStats {
  totalMemories: number
  totalSites: number
  favoriteCategory: string
  oldestMemory?: Date
  newestMemory?: Date
}

export class MemoryService {
  private static async getDb() {
    const client = await clientPromise
    return client.db("whereWeAre")
  }

  // Create a new memory
  static async createMemory(memoryData: Omit<UserMemory, "_id" | "createdAt" | "updatedAt">): Promise<ObjectId> {
    const db = await this.getDb()
    const now = new Date()

    // Convert image buffers to MongoDB Binary for proper storage
    const processedImages = memoryData.images.map((image) => ({
      ...image,
      data: new Binary(image.data as Buffer),
    }))

    const memory: UserMemory = {
      ...memoryData,
      images: processedImages,
      createdAt: now,
      updatedAt: now,
    }

    console.log(`Creating memory with ${processedImages.length} images`) // Debug log

    const result = await db.collection("memories").insertOne(memory)
    return result.insertedId
  }

  // Get memories for a specific user
  static async getUserMemories(userId: string, limit = 50): Promise<UserMemory[]> {
    const db = await this.getDb()
    const memories = await db.collection("memories").find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray()

    return memories as UserMemory[]
  }

  // Get memories for a specific site
  static async getSiteMemories(siteId: string, includePrivate = false): Promise<UserMemory[]> {
    const db = await this.getDb()
    const query: Record<string, unknown> = { siteId }

    if (!includePrivate) {
      query.isPublic = true
    }

    const memories = await db.collection("memories").find(query).sort({ createdAt: -1 }).toArray()

    return memories as UserMemory[]
  }

  // Get all public memories for the map
  static async getPublicMemories(): Promise<UserMemory[]> {
    const db = await this.getDb()
    const memories = await db.collection("memories").find({ isPublic: true }).sort({ createdAt: -1 }).toArray()

    return memories as UserMemory[]
  }

  // Get a specific memory by ID
  static async getMemoryById(memoryId: string): Promise<UserMemory | null> {
    const db = await this.getDb()
    try {
      const memory = await db.collection("memories").findOne({ _id: new ObjectId(memoryId) })

      if (memory) {
        console.log(`Retrieved memory with ${memory.images?.length || 0} images`) // Debug log

        // Convert MongoDB Binary back to Buffer for image data
        if (memory.images) {
          memory.images = memory.images.map((image: UserMemory["images"][number]) => ({
            ...image,
            data: image.data instanceof Binary ? image.data.buffer : image.data,
          }))
        }
      }

      return memory as UserMemory | null
    } catch (error) {
      console.error("Error retrieving memory:", error)
      return null
    }
  }

  // Update a memory
  static async updateMemory(memoryId: string, userId: string, updates: Partial<UserMemory>): Promise<boolean> {
    const db = await this.getDb()
    try {
      // If updating images, convert buffers to Binary
      if (updates.images) {
        updates.images = updates.images.map((image) => ({
          ...image,
          data: Buffer.isBuffer(image.data) ? new Binary(image.data) : image.data,
        }))
      }

      const result = await db.collection("memories").updateOne(
        { _id: new ObjectId(memoryId), userId },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        },
      )
      return result.modifiedCount > 0
    } catch (error) {
      console.error("Error updating memory:", error)
      return false
    }
  }

  // Delete a memory
  static async deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    const db = await this.getDb()
    try {
      const result = await db.collection("memories").deleteOne({
        _id: new ObjectId(memoryId),
        userId,
      })
      return result.deletedCount > 0
    } catch (error) {
      console.error("Error deleting memory:", error)
      return false
    }
  }

  // Get user memory statistics
  static async getUserMemoryStats(userId: string): Promise<MemoryStats> {
    const db = await this.getDb()

    const [totalMemories, categoryStats, dateStats] = await Promise.all([
      db.collection("memories").countDocuments({ userId }),
      db
        .collection("memories")
        .aggregate([
          { $match: { userId } },
          { $group: { _id: "$siteCategory", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ])
        .toArray(),
      db
        .collection("memories")
        .aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              oldest: { $min: "$createdAt" },
              newest: { $max: "$createdAt" },
              uniqueSites: { $addToSet: "$siteId" },
            },
          },
        ])
        .toArray(),
    ])

    const stats: MemoryStats = {
      totalMemories,
      totalSites: dateStats[0]?.uniqueSites?.length || 0,
      favoriteCategory: categoryStats[0]?._id || "Unknown",
      oldestMemory: dateStats[0]?.oldest,
      newestMemory: dateStats[0]?.newest,
    }

    return stats
  }

  // Get nearby memories
  static async getNearbyMemories(lat: number, lng: number, radiusKm = 5): Promise<UserMemory[]> {
    const db = await this.getDb()
    const radiusDegrees = radiusKm / 111.32

    const memories = await db
      .collection("memories")
      .find({
        isPublic: true,
        "coordinates.lat": {
          $gte: lat - radiusDegrees,
          $lte: lat + radiusDegrees,
        },
        "coordinates.lng": {
          $gte: lng - radiusDegrees,
          $lte: lng + radiusDegrees,
        },
      })
      .sort({ createdAt: -1 })
      .toArray()

    return memories as UserMemory[]
  }
}
