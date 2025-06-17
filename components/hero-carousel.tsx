"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Real cultural site images - replace with actual image URLs
const heroImages = [
  {
    url: "/OperaHouse.jpg",
    title: "Opera House",
    description: "Experience world-class performances in our opera house",
    category: "Theatre",
  },
  {
    url: "/Industriemuseum.jpg",
    title: "Industrial Museum",
    description: "Discover the industrial heritage that shaped our city",
    category: "Museum",
  },
  {
    url: "/library.jpg",
    title: "TU Chemnitz Library",
    description: "Everything you are looking for is in the library",
    category: "Library",
  },
  {
    url: "/karlMarx.jpg",
    title: "Karl Marx Monument",
    description: "Iconic landmark that tells our city's story",
    category: "Monument",
  },
]

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
//   const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(new Array(heroImages.length).fill(false))

  // Auto-advance slides
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPlaying])

//   const handleImageLoad = (index: number) => {
//     setImagesLoaded((prev) => {
//       const newState = [...prev]
//       newState[index] = true
//       return newState
//     })
//   }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + heroImages.length) % heroImages.length)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const currentImage = heroImages[currentIndex]

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.title}
              fill
              className="object-cover"
              priority={index === 0}
            //   onLoad={() => handleImageLoad(index)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </div>
        ))}
      </div>

      {/* Rest of the component remains the same... */}
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            {/* Category Badge */}
            {/* <div className="flex justify-start mb-6">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                <MapPin className="h-5 w-5 text-white" />
                <span className="text-sm font-medium text-white">{currentImage.category}</span>
              </div>
            </div> */}

            {/* Main Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                <span className="block">Discover</span>
                <span className="block text-primary-foreground bg-primary/20 backdrop-blur-sm px-4 py-2 rounded-lg inline-block mt-2">
                  {currentImage.title}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">{currentImage.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                  <Link href="#search">
                    Start Exploring
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                {/* <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                  asChild
                >
                  <Link href="/map">View Interactive Map</Link>
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls - same as before */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4 bg-black/30 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
          <Button variant="ghost" size="icon" onClick={goToPrevious} className="text-white hover:bg-white/20 h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex space-x-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-white w-8" : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={goToNext} className="text-white hover:bg-white/20 h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-white/30 mx-2" />
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Side Navigation (Desktop) */}
      <div className="hidden lg:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white hover:bg-white/20 h-12 w-12"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white hover:bg-white/20 h-12 w-12"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Image Info Overlay */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <div className="text-white text-sm">
            <span className="font-medium">{currentIndex + 1}</span>
            <span className="text-white/70"> / {heroImages.length}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
