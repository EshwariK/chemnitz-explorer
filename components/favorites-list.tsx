import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ExternalLink, Trash2 } from "lucide-react"

const favoriteSites = [
  {
    id: 2,
    title: "Museum of Natural History",
    category: "Museum",
    description: "Explore fascinating exhibits of natural specimens and geological formations from the region.",
    dateAdded: "2024-01-15",
  },
  {
    id: 4,
    title: "Red Tower",
    category: "Tourism Spots",
    description: "Medieval tower and landmark offering panoramic views of the city center.",
    dateAdded: "2024-01-10",
  },
  {
    id: 6,
    title: "Chemnitz Art Gallery",
    category: "Art",
    description: "Local artists showcase their contemporary works in this modern gallery space.",
    dateAdded: "2024-01-08",
  },
]

const categoryColors = {
  Theatre: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Museum: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Art: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Tourism Spots": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

export function FavoritesList() {
  if (favoriteSites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground text-center">
            Start exploring cultural sites and add them to your favorites!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {favoriteSites.map((site) => (
        <Card key={site.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg">{site.title}</CardTitle>
                <Badge variant="secondary" className={categoryColors[site.category as keyof typeof categoryColors]}>
                  {site.category}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="text-red-500">
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">{site.description}</p>
            <div className="text-xs text-muted-foreground">
              Added on {new Date(site.dateAdded).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
