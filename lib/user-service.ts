import clientPromise from "./mongodb"
import type { ObjectId } from "mongodb"

export interface UserFavorite {
  _id?: ObjectId
  userId: string
  siteId: string
  siteName: string
  category: string
  description: string
  coordinates: {
    lat: number
    lng: number
  }
  dateAdded: Date
}

export interface UserActivity {
  _id?: ObjectId
  userId: string
  type: "visited" | "favorited" | "viewed"
  siteId: string
  siteName: string
  category: string
  coordinates?: {
    lat: number
    lng: number
  }
  timestamp: Date
}

export interface UserLocation {
  lat: number
  lng: number
  address?: string
  lastUpdated: Date
  accuracy?: number
}

export interface UserProfile {
  _id?: ObjectId
  userId: string
  bio?: string
  location?: string
  interests?: string[]
  currentLocation?: UserLocation
  visitedSites?: number
  createdAt: Date
  updatedAt: Date
}

export interface UserStats {
  favorites: number
  sitesVisited: number
  totalViews: number
  daysActive: number
  favoriteCategories: Array<{ category: string; count: number }>
  recentActivity: UserActivity[]
  firstActivity?: Date
  lastActivity?: Date
}

export interface DashboardData {
  profile: UserProfile | null
  stats: UserStats
  recentFavorites: UserFavorite[]
  hasLocation: boolean
}

export class UserService {
  private static async getDb() {
    const client = await clientPromise
    return client.db("whereWeAre")
  }

  // User Profile Management
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const db = await this.getDb()
    const profile = await db.collection("userProfiles").findOne({ userId })
    return profile as UserProfile | null
  }

  static async createOrUpdateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const db = await this.getDb()
    const now = new Date()

    const existingProfile = await this.getUserProfile(userId)

    if (!existingProfile) {
      const newProfile: UserProfile = {
        userId,
        ...profileData,
        createdAt: now,
        updatedAt: now,
      }
      await db.collection("userProfiles").insertOne(newProfile)
      return newProfile
    } else {
      const updatedProfile = {
        ...existingProfile,
        ...profileData,
        updatedAt: now,
      }
      await db.collection("userProfiles").updateOne({ userId }, { $set: updatedProfile })
      return updatedProfile
    }
  }

  // Location Management
  static async updateUserLocation(userId: string, location: UserLocation): Promise<void> {
    const db = await this.getDb()
    await db.collection("userProfiles").updateOne(
      { userId },
      {
        $set: {
          currentLocation: {
            ...location,
            lastUpdated: new Date(),
          },
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )
  }

  static async getUserLocation(userId: string): Promise<UserLocation | null> {
    const profile = await this.getUserProfile(userId)
    return profile?.currentLocation || null
  }

  // Favorites Management
  static async addFavorite(userId: string, siteData: Omit<UserFavorite, "_id" | "userId" | "dateAdded">) {
    const db = await this.getDb()

    // Check if already favorited
    const existingFavorite = await db.collection("favorites").findOne({
      userId,
      siteId: siteData.siteId,
    })

    if (existingFavorite) {
      return { alreadyExists: true, favorite: existingFavorite }
    }

    const favorite: UserFavorite = {
      userId,
      ...siteData,
      dateAdded: new Date(),
    }

    const result = await db.collection("favorites").insertOne(favorite)

    // Add activity
    await this.addActivity(userId, {
      type: "favorited",
      siteId: siteData.siteId,
      siteName: siteData.siteName,
      category: siteData.category,
      coordinates: siteData.coordinates,
    })

    return { inserted: true, favoriteId: result.insertedId }
  }

  static async removeFavorite(userId: string, siteId: string): Promise<boolean> {
    const db = await this.getDb()
    const result = await db.collection("favorites").deleteOne({ userId, siteId })
    return result.deletedCount > 0
  }

  static async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    const db = await this.getDb()
    const favorites = await db.collection("favorites").find({ userId }).sort({ dateAdded: -1 }).toArray()
    return favorites as UserFavorite[]
  }

  static async isFavorite(userId: string, siteId: string): Promise<boolean> {
    const db = await this.getDb()
    const favorite = await db.collection("favorites").findOne({ userId, siteId })
    return !!favorite
  }

  static async getFavoritesByCategory(
    userId: string,
  ): Promise<Array<{ category: string; count: number; sites: UserFavorite[] }>> {
    const db = await this.getDb()
    const favorites = await db
      .collection("favorites")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            sites: { $push: "$$ROOT" },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()

    return favorites.map((item) => ({
      category: item._id,
      count: item.count,
      sites: item.sites,
    }))
  }

  // Activity Tracking
  static async addActivity(userId: string, activityData: Omit<UserActivity, "_id" | "userId" | "timestamp">) {
    const db = await this.getDb()
    const activity: UserActivity = {
      userId,
      ...activityData,
      timestamp: new Date(),
    }

    const result = await db.collection("activities").insertOne(activity)
    return result.insertedId
  }

  static async getUserActivities(userId: string, limit = 10): Promise<UserActivity[]> {
    const db = await this.getDb()
    const activities = await db.collection("activities").find({ userId }).sort({ timestamp: -1 }).limit(limit).toArray()
    return activities as UserActivity[]
  }

  // Comprehensive User Stats
  static async getUserStats(userId: string): Promise<UserStats> {
    const db = await this.getDb()

    // Get all data in parallel
    const [favoritesCount, visitedCount, viewedCount, favoriteCategories, recentActivity, firstActivity, lastActivity] =
      await Promise.all([
        db.collection("favorites").countDocuments({ userId }),
        db.collection("activities").countDocuments({ userId, type: "visited" }),
        db.collection("activities").countDocuments({ userId, type: "viewed" }),
        db
          .collection("favorites")
          .aggregate([
            { $match: { userId } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ])
          .toArray(),
        db.collection("activities").find({ userId }).sort({ timestamp: -1 }).limit(5).toArray(),
        db.collection("activities").find({ userId }).sort({ timestamp: 1 }).limit(1).toArray(),
        db.collection("activities").find({ userId }).sort({ timestamp: -1 }).limit(1).toArray(),
      ])

    // Calculate days active
    let daysActive = 0
    if (firstActivity.length > 0 && lastActivity.length > 0) {
      const firstDate = new Date(firstActivity[0].timestamp)
      const lastDate = new Date(lastActivity[0].timestamp)
      const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
      daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    return {
      favorites: favoritesCount,
      sitesVisited: visitedCount,
      totalViews: viewedCount,
      daysActive,
      favoriteCategories: favoriteCategories.map((cat) => ({
        category: cat._id,
        count: cat.count,
      })),
      recentActivity: recentActivity as UserActivity[],
      firstActivity: firstActivity[0]?.timestamp || undefined,
      lastActivity: lastActivity[0]?.timestamp || undefined,
    }
  }

  // Get nearby favorites
  static async getNearbyFavorites(userId: string, lat: number, lng: number, radiusKm = 10): Promise<UserFavorite[]> {
    const db = await this.getDb()
    const radiusDegrees = radiusKm / 111.32

    const favorites = await db
      .collection("favorites")
      .find({
        userId,
        "coordinates.lat": {
          $gte: lat - radiusDegrees,
          $lte: lat + radiusDegrees,
        },
        "coordinates.lng": {
          $gte: lng - radiusDegrees,
          $lte: lng + radiusDegrees,
        },
      })
      .toArray()

    return favorites as UserFavorite[]
  }

  // Bulk operations for better performance
  static async getUserDashboardData(userId: string): Promise<DashboardData> {
    const [profile, stats, recentFavorites] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserStats(userId),
      this.getUserFavorites(userId).then((favs) => favs.slice(0, 5)),
    ])

    return {
      profile,
      stats,
      recentFavorites,
      hasLocation: !!profile?.currentLocation,
    }
  }

  // Delete User and all associated data
  static async deleteUser(userId: string): Promise<boolean> {
    const db = await this.getDb()

    try {
      // Delete all user-related data in parallel
      await Promise.all([
        db.collection("users").deleteMany({ userId }),
        db.collection("favorites").deleteMany({ userId }),
        db.collection("activities").deleteMany({ userId }),
        db.collection("memories").deleteMany({ userId }),
        db.collection("accounts").deleteMany({ userId }),
        // Add any other collections that store user data
      ])

      return true
    } catch (error) {
      console.error("Error deleting user data:", error)
      return false
    }
  }
}
