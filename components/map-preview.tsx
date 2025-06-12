import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation } from "lucide-react"

export function MapPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Cultural Sites Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg overflow-hidden">
          {/* Map placeholder with sample pins */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-muted-foreground">Interactive Map Preview</p>
              <p className="text-sm text-muted-foreground mt-1">Leaflet/Mapbox integration would go here</p>
            </div>
          </div>

          {/* Sample map pins */}
          <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
            <MapPin className="h-6 w-6 text-red-500 drop-shadow-lg" />
          </div>
          <div className="absolute top-1/2 right-1/4 transform -translate-x-1/2 -translate-y-1/2">
            <MapPin className="h-6 w-6 text-blue-500 drop-shadow-lg" />
          </div>
          <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MapPin className="h-6 w-6 text-green-500 drop-shadow-lg" />
          </div>
          <div className="absolute top-1/3 right-1/3 transform -translate-x-1/2 -translate-y-1/2">
            <MapPin className="h-6 w-6 text-purple-500 drop-shadow-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
