import { FavoritesList } from "@/components/favorites-list"
import { Heart } from "lucide-react"
import { requireAuth } from "@/lib/auth"

export default async function FavoritesPage() {
  // This will redirect to login if not authenticated
  await requireAuth()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold">Your Favorites</h1>
        </div>
        <p className="text-muted-foreground">Cultural sites you&apos;ve saved for later exploration</p>
      </div>
      <FavoritesList />
    </div>
  )
}
