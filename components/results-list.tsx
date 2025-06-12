import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ExternalLink } from "lucide-react"

const sampleSites = [
  {
    id: 1,
    title: "Chemnitz Opera House",
    category: "Theatre",
    description: "Historic opera house featuring classical and contemporary performances in the heart of Chemnitz.",
    image: "/placeholder.svg?height=200&width=300",
    isFavorite: false,
  },
  {
    id: 2,
    title: "Museum of Natural History",
    category: "Museum",
    description: "Explore fascinating exhibits of natural specimens and geological formations from the region.",
    image: "/placeholder.svg?height=200&width=300",
    isFavorite: true,
  },
  {
    id: 3,
    title: "Kunstsammlungen Chemnitz",
    category: "Art",
    description: "Contemporary art museum showcasing modern works and rotating exhibitions.",
    image: "/placeholder.svg?height=200&width=300",
    isFavorite: false,
  },
  {
    id: 4,
    title: "Red Tower",
    category: "Tourism Spots",
    description: "Medieval tower and landmark offering panoramic views of the city center.",
    image: "/placeholder.svg?height=200&width=300",
    isFavorite: true,
  },
]

const categoryColors = {
  Theatre: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Museum: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Art: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Tourism Spots": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

export function ResultsList() {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Cultural Sites</h3>
      <div className="space-y-4">
        {sampleSites.map((site) => (
          <Card key={site.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{site.title}</CardTitle>
                  <Badge variant="secondary" className={categoryColors[site.category as keyof typeof categoryColors]}>
                    {site.category}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={site.isFavorite ? "text-red-500" : "text-muted-foreground"}
                >
                  <Heart className={`h-4 w-4 ${site.isFavorite ? "fill-current" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{site.description}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
