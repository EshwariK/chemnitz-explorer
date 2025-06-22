"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, Navigation } from "lucide-react"
import { toast } from "sonner"
import { useGeolocation } from "@/hooks/use-geolocation"

interface LocationControlProps {
  onLocationFound?: (lat: number, lng: number) => void
  showNearby?: boolean
}

export function LocationControl({ onLocationFound }: LocationControlProps) {
  const map = useMap()
  const { latitude, longitude, loading, error, getCurrentLocation, accuracy } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5 minutes
  })

  useEffect(() => {
    if (latitude && longitude) {
      onLocationFound?.(latitude, longitude)
    }
  }, [latitude, longitude, onLocationFound])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleGetLocation = () => {
    getCurrentLocation()
  }

  const handleGoToLocation = () => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], 16, {
        animate: true,
        duration: 1,
      })

      toast.success(`Accuracy: ${accuracy ? Math.round(accuracy) : "Unknown"}m`)
    } else {
      getCurrentLocation()
    }
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button size="sm" variant="secondary" onClick={handleGetLocation} disabled={loading} className="shadow-lg">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {loading ? "Finding..." : "Get Location"}
      </Button>

      {latitude && longitude && (
        <>
          <Button size="sm" variant="secondary" onClick={handleGoToLocation} className="shadow-lg">
            <Navigation className="h-4 w-4" />
            Go to Location
          </Button>
        </>
      )}
    </div>
  )
}
