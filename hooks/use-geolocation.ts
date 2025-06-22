"use client"

import { useState, useEffect } from "react"

interface GeolocationState {
  loading: boolean
  accuracy: number | null
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  latitude: number | null
  longitude: number | null
  speed: number | null
  timestamp: number | null
  error: string | null
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null,
  })

  const [watchId, setWatchId] = useState<number | null>(null)

  useEffect(() => {
    // --- TESTING ONLY: Set dummy location ---
    setState((prev) => ({
      ...prev,
      loading: false,
      latitude: 50.83,
      longitude: 12.92,
      accuracy: 10,
      timestamp: Date.now(),
      error: null,
    }))
    // --- END TESTING ---

    // // Original geolocation code (commented out for now)
    // if (!navigator.geolocation) {
    //   setState((prev) => ({
    //     ...prev,
    //     loading: false,
    //     error: "Geolocation is not supported by this browser.",
    //   }))
    //   return
    // }

    // const handleSuccess = (position: GeolocationPosition) => {
    //   setState({
    //     loading: false,
    //     accuracy: position.coords.accuracy,
    //     altitude: position.coords.altitude,
    //     altitudeAccuracy: position.coords.altitudeAccuracy,
    //     heading: position.coords.heading,
    //     latitude: position.coords.latitude,
    //     longitude: position.coords.longitude,
    //     speed: position.coords.speed,
    //     timestamp: position.timestamp,
    //     error: null,
    //   })
    // }

    // const handleError = (error: GeolocationPositionError) => {
    //   let errorMessage = "An unknown error occurred."

    //   switch (error.code) {
    //     case error.PERMISSION_DENIED:
    //       errorMessage = "Location access denied by user."
    //       break
    //     case error.POSITION_UNAVAILABLE:
    //       errorMessage = "Location information is unavailable."
    //       break
    //     case error.TIMEOUT:
    //       errorMessage = "Location request timed out."
    //       break
    //   }

    //   setState((prev) => ({
    //     ...prev,
    //     loading: false,
    //     error: errorMessage,
    //   }))
    // }

    // const geoOptions: PositionOptions = {
    //   enableHighAccuracy: options.enableHighAccuracy ?? true,
    //   timeout: options.timeout ?? 10000,
    //   maximumAge: options.maximumAge ?? 300000, // 5 minutes
    // }

    // // Get current position once
    // navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions)

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge, watchId])

  const startWatching = () => {
    // if (!navigator.geolocation || watchId !== null) return

    // const geoOptions: PositionOptions = {
    //   enableHighAccuracy: options.enableHighAccuracy ?? true,
    //   timeout: options.timeout ?? 10000,
    //   maximumAge: options.maximumAge ?? 60000, // 1 minute for watching
    // }

    // const handleSuccess = (position: GeolocationPosition) => {
    //   setState((prev) => ({
    //     ...prev,
    //     loading: false,
    //     accuracy: position.coords.accuracy,
    //     altitude: position.coords.altitude,
    //     altitudeAccuracy: position.coords.altitudeAccuracy,
    //     heading: position.coords.heading,
    //     latitude: position.coords.latitude,
    //     longitude: position.coords.longitude,
    //     speed: position.coords.speed,
    //     timestamp: position.timestamp,
    //     error: null,
    //   }))
    // }

    // const handleError = (error: GeolocationPositionError) => {
    //   let errorMessage = "An unknown error occurred."

    //   switch (error.code) {
    //     case error.PERMISSION_DENIED:
    //       errorMessage = "Location access denied by user."
    //       break
    //     case error.POSITION_UNAVAILABLE:
    //       errorMessage = "Location information is unavailable."
    //       break
    //     case error.TIMEOUT:
    //       errorMessage = "Location request timed out."
    //       break
    //   }

    //   setState((prev) => ({
    //     ...prev,
    //     loading: false,
    //     error: errorMessage,
    //   }))
    // }

    // const id = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions)
    // setWatchId(id)
  }

  const stopWatching = () => {
    // if (watchId !== null) {
    //   navigator.geolocation.clearWatch(watchId)
    //   setWatchId(null)
    // }
  }

  const getCurrentLocation = () => {
    // if (!navigator.geolocation) return

    // setState((prev) => ({ ...prev, loading: true, error: null }))

    // const geoOptions: PositionOptions = {
    //   enableHighAccuracy: options.enableHighAccuracy ?? true,
    //   timeout: options.timeout ?? 10000,
    //   maximumAge: 0, // Force fresh location
    // }

    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     setState({
    //       loading: false,
    //       accuracy: position.coords.accuracy,
    //       altitude: position.coords.altitude,
    //       altitudeAccuracy: position.coords.altitudeAccuracy,
    //       heading: position.coords.heading,
    //       latitude: position.coords.latitude,
    //       longitude: position.coords.longitude,
    //       speed: position.coords.speed,
    //       timestamp: position.timestamp,
    //       error: null,
    //     })
    //   },
    //   (error) => {
    //     let errorMessage = "An unknown error occurred."

    //     switch (error.code) {
    //       case error.PERMISSION_DENIED:
    //         errorMessage = "Location access denied by user."
    //         break
    //       case error.POSITION_UNAVAILABLE:
    //         errorMessage = "Location information is unavailable."
    //         break
    //       case error.TIMEOUT:
    //         errorMessage = "Location request timed out."
    //         break
    //     }

    //     setState((prev) => ({
    //       ...prev,
    //       loading: false,
    //       error: errorMessage,
    //     }))
    //   },
    //   geoOptions,
    // )
  }

  return {
    ...state,
    startWatching,
    stopWatching,
    getCurrentLocation,
    isWatching: watchId !== null,
  }
}
