import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Heart, Eye } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "visited",
    site: "Chemnitz Opera House",
    category: "Theatre",
    timestamp: "2024-01-20T10:30:00Z",
    icon: MapPin,
  },
  {
    id: 2,
    type: "favorited",
    site: "Museum of Natural History",
    category: "Museum",
    timestamp: "2024-01-19T15:45:00Z",
    icon: Heart,
  },
  {
    id: 3,
    type: "viewed",
    site: "Red Tower",
    category: "Tourism Spots",
    timestamp: "2024-01-19T09:15:00Z",
    icon: Eye,
  },
  {
    id: 4,
    type: "visited",
    site: "Kunstsammlungen Chemnitz",
    category: "Art",
    timestamp: "2024-01-18T14:20:00Z",
    icon: MapPin,
  },
]

const activityColors = {
  visited: "text-blue-500",
  favorited: "text-red-500",
  viewed: "text-green-500",
}

const categoryColors = {
  Theatre: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Museum: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Art: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Tourism Spots": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <div
                className={`p-2 rounded-full bg-muted ${activityColors[activity.type as keyof typeof activityColors]}`}
              >
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {activity.type === "visited" && "Visited"}
                  {activity.type === "favorited" && "Added to favorites"}
                  {activity.type === "viewed" && "Viewed details of"}{" "}
                  <span className="font-semibold">{activity.site}</span>
                </p>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={categoryColors[activity.category as keyof typeof categoryColors]}
                  >
                    {activity.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
