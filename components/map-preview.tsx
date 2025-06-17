import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "lucide-react"
import type { CulturalSite } from "@/lib/cultural-sites-service"

const InteractiveMap = dynamic(() => import("./interactive-map"), { ssr: false })

interface MapPreviewProps {
  sites: CulturalSite[]
  highlightedSiteId?: string | null
  onMarkerClick?: (site: CulturalSite) => void
  onLocationFound?: (lat: number, lng: number) => void
}

export function MapPreview({ sites, highlightedSiteId, onMarkerClick, onLocationFound }: MapPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Sites Map
          {sites.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({sites.length} sites)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <InteractiveMap
          sites={sites}
          highlightedSiteId={highlightedSiteId}
          onMarkerClick={onMarkerClick}
          onLocationFound={onLocationFound}
          height="400px"
          showLocationControl={true}
          showNearbySearch={true}
        />
      </CardContent>
    </Card>
  )
}
