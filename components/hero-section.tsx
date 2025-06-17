import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react" // MapPin
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 rounded-full px-4 py-2 backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Chemnitz Cultural Guide</span>
            </div>
          </div> */}

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Look around.
            <span className="text-primary block">There&apos;s more than meets the map</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover and explore cultural landmarks around Chemnitz. Explore, remember, and share where we are.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="#search">
                Start Exploring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/map">View Map</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
