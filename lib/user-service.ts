import clientPromise from "./mongodb"
import type { ObjectId } from "mongodb"

export interface UserFavorite {
  _id?: ObjectId
  userId: string
  siteId: string
  siteName: string
  category: string
  description: string
  dateAdded: Date
}

export interface UserActivity {
  _id?: ObjectId
  userId: string
  type: "visited" | "favorited" | "viewed"
  siteId: string
  siteName: string
  category: string
  timestamp: Date
}

export interface UserProfile {
  _id?: ObjectId
  userId: string
  bio?: string
  location?: string
  interests?: string[]
  visitedSites?: number
  createdAt: Date
  updatedAt: Date
}

export class UserService {
  private static async getDb() {
    const client = await clientPromise
    return client.db()
  }

  // User Profile
  static async getUserProfile(userId: string) {
    const db = await this.getDb()
    const profile = await db.collection("userProfiles").findOne({ userId })
    return profile
  }

  static async createOrUpdateUserProfile(userId: string, profileData: Partial<UserProfile>) {
    const db = await this.getDb()
    const now = new Date()

    const existingProfile = await this.getUserProfile(userId)

    if (!existingProfile) {
      // Create new profile
      const newProfile: UserProfile = {
        userId,
        ...profileData,
        createdAt: now,
        updatedAt: now,
      }
      await db.collection("userProfiles").insertOne(newProfile)
      return newProfile
    } else {
      // Update existing profile
      const updatedProfile = {
        ...existingProfile,
        ...profileData,
        updatedAt: now,
      }
      await db.collection("userProfiles").updateOne({ userId }, { $set: updatedProfile })
      return updatedProfile
    }
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
    })

    return { inserted: true, favoriteId: result.insertedId }
  }

  static async removeFavorite(userId: string, siteId: string) {
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

  // User Stats
  static async getUserStats(userId: string) {
    const db = await this.getDb()

    // Get counts from different collections
    const favoritesCount = await db.collection("favorites").countDocuments({ userId })

    const visitedCount = await db.collection("activities").countDocuments({ userId, type: "visited" })

    const viewedCount = await db.collection("activities").countDocuments({ userId, type: "viewed" })

    // Get first and last activity dates
    const firstActivity = await db.collection("activities").find({ userId }).sort({ timestamp: 1 }).limit(1).toArray()

    const lastActivity = await db.collection("activities").find({ userId }).sort({ timestamp: -1 }).limit(1).toArray()

    // Calculate days active (if activities exist)
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
      firstActivity: firstActivity[0]?.timestamp || null,
      lastActivity: lastActivity[0]?.timestamp || null,
    }
  }
}
