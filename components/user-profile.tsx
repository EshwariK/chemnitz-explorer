"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, MapPin, Navigation, RefreshCw } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation"
import type { DashboardData } from "@/lib/user-service"

interface UserProfileProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  initialData?: DashboardData
}

interface ProfileData {
  bio: string
  location: string
  interests: string
}

interface LocationData {
  lat: number
  lng: number
  address?: string
  lastUpdated: Date
  accuracy?: number
}

export function UserProfile({ user, initialData }: UserProfileProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    bio: "",
    location: "",
    interests: "",
  })
  const [userLocation, setUserLocation] = useState<LocationData | null>(null)
  const [stats, setStats] = useState<DashboardData["stats"] | null>(null)

  const { latitude, longitude, accuracy, getCurrentLocation, loading: geoLoading } = useGeolocation()

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        if (initialData) {
          // Use server-side data if available
          const { profile, stats: userStats } = initialData
          setProfileData({
            bio: profile?.bio || "",
            location: profile?.location || "",
            interests: (profile?.interests || []).join(", "),
          })
          setUserLocation(profile?.currentLocation || null)
          setStats(userStats)
        } else {
          // Fallback to client-side fetch
          const [profileResponse, statsResponse] = await Promise.all([
            fetch("/api/user/profile"),
            fetch("/api/user/stats"),
          ])

          if (profileResponse.ok) {
            const profile = await profileResponse.json()
            setProfileData({
              bio: profile.bio || "",
              location: profile.location || "",
              interests: (profile.interests || []).join(", "),
            })
            setUserLocation(profile.currentLocation || null)
          }

          if (statsResponse.ok) {
            const userStats = await statsResponse.json()
            setStats(userStats)
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: profileData.bio,
          location: profileData.location,
          interests: profileData.interests
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean),
        }),
      })

      if (response.ok) {
        toast.success("Your profile has been successfully updated.")
      } else {
        toast.error("Failed to update profile. Please try again.")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateLocation = async () => {
    setUpdatingLocation(true)

    try {
      // Get fresh location
      getCurrentLocation()

      // Wait a moment for location to update
      setTimeout(async () => {
        if (latitude && longitude) {
          const response = await fetch("/api/user/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude,
              accuracy: accuracy,
            }),
          })

          if (response.ok) {
            const locationData = await response.json()
            setUserLocation(locationData.location)
            toast.success(`Location saved with ${accuracy ? Math.round(accuracy) : "unknown"}m accuracy`)
          } else {
            toast.error("Failed to save location. Please try again.")
          }
        } else {
          toast.warning("Please enable location access and try again.")
        }
        setUpdatingLocation(false)
      }, 2000)
    } catch (error) {
      console.error("Error updating location:", error)
      toast.error("Failed to update location. Please try again.")
      setUpdatingLocation(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column - Profile Info */}
      <div className="lg:col-span-1 space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image || ""} alt={user.name || "User"} />
              <AvatarFallback>{user.name ? getInitials(user.name) : "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-medium text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Settings
            </CardTitle>
            <CardDescription>Manage your current location for personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userLocation ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Location saved</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Lat: {userLocation.lat.toFixed(6)}</p>
                  <p>Lng: {userLocation.lng.toFixed(6)}</p>
                  {userLocation.accuracy && <p>Accuracy: ±{Math.round(userLocation.accuracy)}m</p>}
                  <p>Updated: {new Date(userLocation.lastUpdated).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>No location saved. Enable location to get personalized recommendations.</p>
              </div>
            )}

            <Button
              onClick={handleUpdateLocation}
              disabled={updatingLocation || geoLoading}
              className="w-full"
              variant="outline"
            >
              {updatingLocation || geoLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {userLocation ? "Update Location" : "Save Current Location"}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{stats.favorites}</div>
                  <div className="text-xs text-muted-foreground">Favorites</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.sitesVisited}</div>
                  <div className="text-xs text-muted-foreground">Visited</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.totalViews}</div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{stats.daysActive}</div>
                  <div className="text-xs text-muted-foreground">Days Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Profile Form */}
      <div className="lg:col-span-2">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your profile information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself and your cultural interests"
                  value={profileData.bio}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Your city or region (e.g., Chemnitz, Germany)"
                  value={profileData.location}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  This is different from your GPS location - it&apos;s for your profile display
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Cultural Interests</Label>
                <Input
                  id="interests"
                  name="interests"
                  placeholder="Art, History, Architecture, Music, Theatre (comma separated)"
                  value={profileData.interests}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">Separate interests with commas</p>
              </div>

              {/* Favorite Categories */}
              {stats?.favoriteCategories && stats.favoriteCategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Favorite Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {stats.favoriteCategories.map((cat) => (
                      <Badge key={cat.category} variant="secondary">
                        {cat.category} ({cat.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
