"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Heart, Eye, Calendar } from "lucide-react"

interface UserStats {
  sitesVisited: number
  favorites: number
  totalViews: number
  daysActive: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<UserStats>({
    sitesVisited: 0,
    favorites: 0,
    totalViews: 0,
    daysActive: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/user/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsData = [
    {
      title: "Sites Visited",
      value: stats.sitesVisited.toString(),
      description: "Cultural sites explored",
      icon: MapPin,
      color: "text-blue-500",
    },
    {
      title: "Favorites",
      value: stats.favorites.toString(),
      description: "Sites saved for later",
      icon: Heart,
      color: "text-red-500",
    },
    {
      title: "Total Views",
      value: stats.totalViews.toString(),
      description: "Site details viewed",
      icon: Eye,
      color: "text-green-500",
    },
    {
      title: "Days Active",
      value: stats.daysActive.toString(),
      description: "Days using the app",
      icon: Calendar,
      color: "text-purple-500",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse w-16" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
