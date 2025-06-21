"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Map, Heart, Share2, MapPin } from "lucide-react"
import { useSession } from "next-auth/react"
import type { UserMemory } from "@/lib/memory-service"

const TinyPerfectMap = dynamic(() => import("@/components/tiny-perfect-map"), { ssr: false })

export default function TinyPerfectThingsPage() {
  const { data: session } = useSession()
  const [allMemories, setAllMemories] = useState<UserMemory[]>([])
  const [userMemories, setUserMemories] = useState<UserMemory[]>([])
  const [activeTab, setActiveTab] = useState("explore")

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const [publicResponse, userResponse] = await Promise.all([
          fetch("/api/memories?public=true"),
          session ? fetch(`/api/memories?userId=${session.user.id}`) : Promise.resolve(null),
        ])

        if (publicResponse.ok) {
          const publicData = await publicResponse.json()
          setAllMemories(publicData)
        }

        if (userResponse && typeof userResponse.json === "function" && userResponse.ok) {
          const userData = await userResponse.json()
          setUserMemories(userData)
        }
      } catch (error) {
        console.error("Error fetching memories:", error)
      }
    }

    fetchMemories()
  }, [session])

  const refreshMemories = async () => {
    try {
      const [publicResponse, userResponse] = await Promise.all([
        fetch("/api/memories?public=true"),
        session ? fetch(`/api/memories?userId=${session.user.id}`) : Promise.resolve(null),
      ])

      if (publicResponse.ok) {
        const publicData = await publicResponse.json()
        setAllMemories(publicData)
      }

      if (userResponse && typeof userResponse.json === "function" && userResponse.ok) {
        const userData = await userResponse.json()
        setUserMemories(userData)
      }
    } catch (error) {
      console.error("Error refreshing memories:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Map of Tiny Perfect Things - Chemnitz",
          text: "Discover beautiful moments captured by visitors to Chemnitz's cultural sites",
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // You could show a toast here
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/50 dark:from-emerald-950/20 dark:via-green-950/10 dark:to-teal-950/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-emerald-500 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Map of Tiny Perfect Things
            </h1>
            <Sparkles className="h-8 w-8 text-emerald-500 animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A collection of beautiful moments captured by visitors to Chemnitz&apos;s cultural treasures. Each pin tells
            a story, each photo holds a memory.
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"
            >
              <Heart className="h-3 w-3 mr-1" />
              {allMemories.length} Memories
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {new Set(allMemories.map((m) => m.siteId)).size} Places
            </Badge>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Explore All
            </TabsTrigger>
            <TabsTrigger value="yours" className="flex items-center gap-2" disabled={!session}>
              <Heart className="h-4 w-4" />
              Your Memories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore">
            <Card className="border-emerald-200 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="h-5 w-5" />
                  Discover Tiny Perfect Moments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TinyPerfectMap
                  memories={allMemories}
                  height="600px"
                  showUserLocation={true}
                  onMemoryDeleted={refreshMemories}
                  currentUserId={session?.user?.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yours">
            {session ? (
              <Card className="border-emerald-200 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                    <Heart className="h-5 w-5" />
                    Your Tiny Perfect Things
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TinyPerfectMap
                    memories={userMemories}
                    height="600px"
                    showUserLocation={true}
                    personalMap={true}
                    onMemoryDeleted={refreshMemories}
                    currentUserId={session?.user?.id}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-emerald-200">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Heart className="h-12 w-12 text-emerald-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sign in to see your memories</h3>
                  <p className="text-muted-foreground">
                    Create an account to start capturing your own tiny perfect moments
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats Section */}
        {allMemories.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-emerald-600 mb-2">{allMemories.length}</div>
                <div className="text-sm text-muted-foreground">Tiny Perfect Moments</div>
              </CardContent>
            </Card>

            <Card className="text-center border-blue-200 bg-gradient-to-br from-blue-50/50 to-sky-50/30 dark:from-blue-950/20 dark:to-sky-950/10">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {new Set(allMemories.map((m) => m.siteId)).size}
                </div>
                <div className="text-sm text-muted-foreground">Cultural Places</div>
              </CardContent>
            </Card>

            <Card className="text-center border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {allMemories.reduce((total, memory) => total + memory.images.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Beautiful Photos</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
