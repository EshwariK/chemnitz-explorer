"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { CulturalSite } from "@/lib/cultural-sites-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  ExternalLink,
  Phone,
  Globe,
  Navigation,
  Info,
  Heart,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { LocationControl } from "./location-control"
import { SiteDetailsModal } from "./site-details-modal"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useFavorites } from "@/hooks/use-favorites"

const categoryColors = {
  Theatre: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/30",
  Museum: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/30",
  Artwork: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/30",
  Gallery: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/30",
  Memorial: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/30",
  Restaurant: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/30",
  Library: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/30",
}

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
    Artwork: "#10b981", // green
    Gallery: "#f59e0b", // orange
    Memorial: "#ef4444", // red
    Restaurant: "#6366f1", // indigo
    Library: "#ee82ee", // violet
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
                : category === "Artwork"
                  ? "🎨"
                  : category === "Restaurant"
                    ? "🍴"
                    : category === "Memorial"
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

// Create user location icon
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: 32px;
          height: 32px;
          border: 2px solid #3b82f6;
          border-radius: 50%;
          opacity: 0.3;
          animation: locationPulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes locationPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `,
    className: "user-location-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// Component to handle map updates
function MapUpdater({
  sites,
  highlightedSiteId,
  // onMarkerClick,
  userLocation,
}: {
  sites: CulturalSite[]
  highlightedSiteId: string | null
  onMarkerClick: (site: CulturalSite) => void
  userLocation: { lat: number; lng: number } | null
}) {
  const map = useMap()

  useEffect(() => {
    if (sites.length > 0) {
      // Calculate bounds to fit all markers
      const bounds = L.latLngBounds(sites.map((site) => [site.coordinates.lat, site.coordinates.lng]))

      // Include user location in bounds if available
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng])
      }

      // Fit map to show all markers with some padding
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [sites, map, userLocation])

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
  showLocationControl?: boolean
  showNearbySearch?: boolean
  onLocationFound?: (lat: number, lng: number) => void
}

export function InteractiveMap({
  sites,
  highlightedSiteId = null,
  onMarkerClick,
  height = "400px",
  className = "",
  showLocationControl = true,
  showNearbySearch = false,
  onLocationFound,
}: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { latitude, longitude, accuracy } = useGeolocation()

  const { toggleFavorite, isFavorited, isFavoriting } = useFavorites()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isFullscreen])

  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : null

  const handleSiteDetailsClick = (site: CulturalSite) => {
    setSelectedSite(site)
    setDetailsModalOpen(true)
  }

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
  const center = userLocation
    ? ([userLocation.lat, userLocation.lng] as [number, number])
    : sites.length > 0
      ? ([sites[0].coordinates.lat, sites[0].coordinates.lng] as [number, number])
      : defaultCenter

  const mapContainerClass = isFullscreen
    ? "fixed inset-0 z-[9999] bg-white dark:bg-gray-900"
    : `rounded-lg overflow-hidden z-40 border relative ${className}`

  const mapHeight = isFullscreen ? "100vh" : height

  return (
    <>
      {/* Map container */}
      <div className={mapContainerClass} style={{ height: mapHeight }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater
            sites={sites}
            highlightedSiteId={highlightedSiteId}
            onMarkerClick={onMarkerClick || (() => {})}
            userLocation={userLocation}
          />

          {/* User location marker */}
          {userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserLocationIcon()}>
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">Your Location</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Accuracy: {accuracy ? `±${Math.round(accuracy)}m` : "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Accuracy circle */}
              {accuracy && accuracy < 1000 && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={accuracy}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              )}
            </>
          )}

          {/* Cultural site markers */}
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
                        <Badge
                          variant="secondary"
                          className={`${categoryColors[site.category as keyof typeof categoryColors] || ""} text-xs`}
                        >
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

                      {/* Distance from user location */}
                      {userLocation && (
                        <div className="text-xs text-gray-500">
                          Distance:{" "}
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            site.coordinates.lat,
                            site.coordinates.lng,
                          ).toFixed(1)}
                          km
                        </div>
                      )}

                      {/* Action buttons */}
                      {(() => {
                        const siteId = site._id?.toString()
                        const isCurrentlyFavorited = isFavorited(siteId)
                        const isCurrentlyFavoriting = isFavoriting(siteId)

                        return (
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" onClick={() => handleSiteDetailsClick(site)} className="flex-1">
                              <Info className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleFavorite(site)}
                              disabled={isCurrentlyFavoriting}
                              className={`${isCurrentlyFavorited ? "text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-950/20" : ""}`}
                            >
                              {isCurrentlyFavoriting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Heart className={`h-3 w-3 ${isCurrentlyFavorited ? "fill-current" : ""}`} />
                              )}
                            </Button>
                            {site.website && (
                              <Button size="sm" variant="outline" onClick={() => window.open(site.website, "_blank")}>
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Location control */}
          {showLocationControl && <LocationControl onLocationFound={onLocationFound} showNearby={showNearbySearch} />}
        </MapContainer>

        {/* Fullscreen toggle button */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 z-[1000] bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {/* Fullscreen overlay controls */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 z-[1000] flex gap-2">
            <Button
              variant="outline"
              onClick={toggleFullscreen}
              className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 shadow-lg"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </Button>
            <div className="text-xs text-gray-500 bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-md shadow-lg">
              Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to exit
            </div>
          </div>
        )}
      </div>

      {/* Site Details Modal */}
      <SiteDetailsModal site={selectedSite} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
    </>
  )
}

// Helper function to calculate distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export default InteractiveMap