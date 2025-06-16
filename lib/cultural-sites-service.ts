import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"

export interface CulturalSite {
  _id?: ObjectId
  osmId: string
  name: string
  category: string
  description?: string
  address?: string
  coordinates: {
    lat: number
    lng: number
  }
  tags: Record<string, any>
  website?: string
  phone?: string
  openingHours?: string
  accessibility?: {
    wheelchair?: "yes" | "no" | "limited"
    parking?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface SearchFilters {
  category?: string
  search?: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  accessibility?: {
    wheelchair?: boolean
    parking?: boolean
  }
}

export interface PaginationOptions {
  page: number
  limit: number
}

export class CulturalSitesService {
  private static async getDb() {
    const client = await clientPromise
    return client.db("Chemnitz")
  }

  // Get all cultural sites with pagination and filtering
  static async getCulturalSites(filters: SearchFilters = {}, pagination: PaginationOptions = { page: 1, limit: 20 }) {
    const db = await this.getDb()
    const collection = db.collection("CulturalSites")

    // Build query
    const query: any = {}

    // Category filter
    if (filters.category && filters.category !== "all") {
      query.category = filters.category
    }

    // Text search
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
        { address: { $regex: filters.search, $options: "i" } },
      ]
    }

    // Geographic bounds filter
    if (filters.bounds) {
      query["coordinates.lat"] = {
        $gte: filters.bounds.south,
        $lte: filters.bounds.north,
      }
      query["coordinates.lng"] = {
        $gte: filters.bounds.west,
        $lte: filters.bounds.east,
      }
    }

    // Accessibility filters
    if (filters.accessibility?.wheelchair) {
      query["accessibility.wheelchair"] = "yes"
    }
    if (filters.accessibility?.parking) {
      query["accessibility.parking"] = true
    }

    // Calculate pagination
    const skip = (pagination.page - 1) * pagination.limit

    // Execute query
    const [sites, total] = await Promise.all([
      collection.find(query).sort({ name: 1 }).skip(skip).limit(pagination.limit).toArray(),
      collection.countDocuments(query),
    ])

    return {
      data: sites as CulturalSite[],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    }
  }

  // Get a single cultural site by ID
  static async getCulturalSiteById(id: string) {
    const db = await this.getDb()
    const collection = db.collection("CulturalSites")

    try {
      const site = await collection.findOne({ _id: new ObjectId(id) })
      return site as CulturalSite | null
    } catch (error) {
      return null
    }
  }

  // Get cultural sites by OSM ID
  static async getCulturalSiteByOsmId(osmId: string) {
    const db = await this.getDb()
    const collection = db.collection("CulturalSites")

    const site = await collection.findOne({ osmId })
    return site as CulturalSite | null
  }

  // Get cultural sites within a radius of a point
  static async getCulturalSitesNearby(lat: number, lng: number, radiusKm = 5, limit = 20) {
    const db = await this.getDb()
    const collection = db.collection("CulturalSites")

    // Convert radius from km to degrees (approximate)
    const radiusDegrees = radiusKm / 111.32

    const sites = await collection
      .find({
        "coordinates.lat": {
          $gte: lat - radiusDegrees,
          $lte: lat + radiusDegrees,
        },
        "coordinates.lng": {
          $gte: lng - radiusDegrees,
          $lte: lng + radiusDegrees,
        },
      })
      .limit(limit)
      .toArray()

    // Calculate actual distances and sort
    const sitesWithDistance = sites.map((site) => {
      const distance = this.calculateDistance(lat, lng, site.coordinates.lat, site.coordinates.lng)
      return { ...site, distance }
    })

    return sitesWithDistance.filter((site) => site.distance <= radiusKm).sort((a, b) => a.distance - b.distance)
  }

  // Get categories with counts
  static async getCategories() {
    const db = await this.getDb()
    const collection = db.collection("CulturalSites")

    const categories = await collection
      .aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray()

    return categories.map((cat) => ({
      category: cat._id,
      count: cat.count,
    }))
  }

  // Get statistics
  static async getStatistics() {
    const db = await this.getDb()
    const collection = db.collection("CulturalSites")

    const [totalSites, categories, accessibleSites] = await Promise.all([
      collection.countDocuments(),
      this.getCategories(),
      collection.countDocuments({ "accessibility.wheelchair": "yes" }),
    ])

    return {
      totalSites,
      categories,
      accessibleSites,
      lastUpdated: new Date(),
    }
  }

  // Helper function to calculate distance between two points
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
