import { HeroSection } from "@/components/hero-section"
import { SearchFilters } from "@/components/search-filters"
import { MapPreview } from "@/components/map-preview"
import { ResultsList } from "@/components/results-list"

export default function HomePage() {
  return (
    <div className="space-y-12 pb-12">
      <HeroSection />
      <div className="container mx-auto px-4 space-y-12">
        <SearchFilters />
        <div className="grid lg:grid-cols-2 gap-8">
          <MapPreview />
          <ResultsList />
        </div>
      </div>
    </div>
  )
}
