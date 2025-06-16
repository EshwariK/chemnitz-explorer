"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { CulturalSite } from "@/lib/cultural-sites-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, Phone, Globe } from "lucide-react"

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom marker icons for different categories
const createCustomIcon = (category: string, isHighlighted = false) => {
  const colors = {
    Theatre: "#8b5cf6", // purple
    Museum: "#3b82f6", // blue
    Art: "#10b981", // green
    "Tourism Spots": "#f59e0b", // orange
    Monument: "#ef4444", // red
    Gallery: "#6366f1", // indigo
    Library: "#eab308", // yellow
  }

  const color = colors[category as keyof typeof colors] || "#6b7280"
  const size = isHighlighted ? 35 : 25

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isHighlighted ? "animation: pulse 2s infinite;" : ""}
      ">
        <div style="color: white; font-size: ${size > 30 ? "16px" : "12px"}; font-weight: bold;">
          ${
            category === "Theatre"
              ? "🎭"
              : category === "Museum"
                ? "🏛️"
                : category === "Art"
                  ? "🎨"
                  : category === "Tourism Spots"
                    ? "📍"
                    : category === "Monument"
                      ? "🗿"
                      : category === "Gallery"
                        ? "🖼️"
                        : category === "Library"
                          ? "📚"
                          : "📍"
          }
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Component to handle map updates
function MapUpdater({
  sites,
  highlightedSiteId,
//   onMarkerClick,
}: {
  sites: CulturalSite[]
  highlightedSiteId: string | null
  onMarkerClick: (site: CulturalSite) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (sites.length > 0) {
      // Calculate bounds to fit all markers
      const bounds = L.latLngBounds(sites.map((site) => [site.coordinates.lat, site.coordinates.lng]))

      // Fit map to show all markers with some padding
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [sites, map])

  useEffect(() => {
    if (highlightedSiteId) {
      const site = sites.find((s) => s._id?.toString() === highlightedSiteId)
      if (site) {
        // Pan to highlighted site and zoom in a bit
        map.setView([site.coordinates.lat, site.coordinates.lng], Math.max(map.getZoom(), 15), {
          animate: true,
          duration: 1,
        })
      }
    }
  }, [highlightedSiteId, sites, map])

  return null
}

interface InteractiveMapProps {
  sites: CulturalSite[]
  highlightedSiteId?: string | null
  onMarkerClick?: (site: CulturalSite) => void
  height?: string
  className?: string
}

export function InteractiveMap({
  sites,
  highlightedSiteId = null,
  onMarkerClick,
  height = "400px",
  className = "",
}: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  // Default center (Chemnitz city center)
  const defaultCenter: [number, number] = [50.8278, 12.9214]
  const center =
    sites.length > 0 ? ([sites[0].coordinates.lat, sites[0].coordinates.lng] as [number, number]) : defaultCenter

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`} style={{ height }}>
      <MapContainer
        key="chemnitz-map"
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater sites={sites} highlightedSiteId={highlightedSiteId} onMarkerClick={onMarkerClick || (() => {})} />

        {sites.map((site) => {
          const siteId = site._id?.toString()
          const isHighlighted = siteId === highlightedSiteId

          return (
            <Marker
              key={siteId}
              position={[site.coordinates.lat, site.coordinates.lng]}
              icon={createCustomIcon(site.category, isHighlighted)}
              eventHandlers={{
                click: () => onMarkerClick?.(site),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{site.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {site.category}
                      </Badge>
                    </div>

                    {site.description && <p className="text-sm text-gray-600">{site.description}</p>}

                    {site.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{site.address}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      {site.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {site.phone}
                        </div>
                      )}
                      {site.website && (
                        <div className="flex items-center text-gray-600">
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </div>
                      )}
                      {site.accessibility?.wheelchair === "yes" && (
                        <Badge variant="outline" className="text-xs">
                          ♿ Accessible
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (site.website) {
                            window.open(site.website, "_blank")
                          }
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default InteractiveMap