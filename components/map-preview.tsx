import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "lucide-react"
import type { CulturalSite } from "@/lib/cultural-sites-service"

const InteractiveMap = dynamic(() => import("./interactive-map"), { ssr: false })


interface MapPreviewProps {
  sites: CulturalSite[]
  highlightedSiteId?: string | null
  onMarkerClick?: (site: CulturalSite) => void
}

export function MapPreview({ sites, highlightedSiteId, onMarkerClick }: MapPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Cultural Sites Map
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
          height="400px"
        />
      </CardContent>
    </Card>
  )
}
