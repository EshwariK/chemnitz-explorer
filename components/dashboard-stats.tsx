import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Heart, Eye, Calendar } from "lucide-react"

const stats = [
  {
    title: "Sites Visited",
    value: "12",
    description: "Cultural sites explored",
    icon: MapPin,
    color: "text-blue-500",
  },
  {
    title: "Favorites",
    value: "8",
    description: "Sites saved for later",
    icon: Heart,
    color: "text-red-500",
  },
  {
    title: "Total Views",
    value: "45",
    description: "Site details viewed",
    icon: Eye,
    color: "text-green-500",
  },
  {
    title: "Days Active",
    value: "23",
    description: "Days using the app",
    icon: Calendar,
    color: "text-purple-500",
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
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
