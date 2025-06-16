"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  ShipWheelIcon as Wheelchair,
  Utensils,
  CreditCard,
  ChevronDown,
  ExternalLink,
  Calendar,
  User,
  Building,
  Info,
  Wifi,
  Baby,
  Snowflake,
  Coffee,
} from "lucide-react"
import type { CulturalSite } from "@/lib/cultural-sites-service"

interface SiteDetailsModalProps {
  site: CulturalSite | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Label mapping for better display
const labelMapping: Record<string, string> = {
  // Contact & Basic Info
  "contact:phone": "Phone",
  "contact:email": "Email",
  "contact:website": "Website",
  phone: "Phone",
  email: "Email",
  website: "Website",
  opening_hours: "Opening Hours",

  // Address components
  "addr:street": "Street",
  "addr:housenumber": "House Number",
  "addr:postcode": "Postal Code",
  "addr:city": "City",

  // Accessibility & Facilities
  wheelchair: "Wheelchair Access",
  toilets: "Toilets Available",
  changing_table: "Baby Changing Table",
  air_conditioning: "Air Conditioning",
  internet_access: "Internet Access",
  biergarten: "Beer Garden",

  // Food & Services
  cuisine: "Cuisine Type",
  takeaway: "Takeaway Available",
  delivery: "Delivery Available",
  lunch: "Lunch Served",
  reservation: "Reservations",

  // Diet options
  "diet:vegetarian": "Vegetarian Options",
  "diet:vegan": "Vegan Options",
  "diet:halal": "Halal Options",
  "diet:kosher": "Kosher Options",
  "diet:gluten_free": "Gluten-Free Options",

  // Payment methods
  "payment:cash": "Cash",
  "payment:cards": "Cards",
  "payment:mastercard": "Mastercard",
  "payment:visa": "Visa",
  "payment:american_express": "American Express",
  "payment:contactless": "Contactless Payment",

  // Cultural & Attribution
  wikidata: "Wikidata",
  wikipedia: "Wikipedia",
  artist_name: "Artist",
  material: "Material",
  year_of_construction: "Year Built",
  museum_type: "Museum Type",
  "theatre:type": "Theatre Type",
  monument: "Monument Type",
  inscription: "Inscription",
  heritage: "Heritage Status",
}

// Icons for different field types
const getFieldIcon = (key: string) => {
  if (key.includes("phone")) return <Phone className="h-4 w-4" />
  if (key.includes("email")) return <Mail className="h-4 w-4" />
  if (key.includes("website") || key.includes("wikidata") || key.includes("wikipedia"))
    return <Globe className="h-4 w-4" />
  if (key.includes("opening_hours")) return <Clock className="h-4 w-4" />
  if (key.includes("wheelchair")) return <Wheelchair className="h-4 w-4" />
  if (key.includes("addr") || key === "address") return <MapPin className="h-4 w-4" />
  if (key.includes("cuisine") || key.includes("diet") || key.includes("takeaway") || key.includes("delivery"))
    return <Utensils className="h-4 w-4" />
  if (key.includes("payment")) return <CreditCard className="h-4 w-4" />
  if (key.includes("internet")) return <Wifi className="h-4 w-4" />
  if (key.includes("changing_table")) return <Baby className="h-4 w-4" />
  if (key.includes("air_conditioning")) return <Snowflake className="h-4 w-4" />
  if (key.includes("year") || key.includes("construction")) return <Calendar className="h-4 w-4" />
  if (key.includes("artist")) return <User className="h-4 w-4" />
  if (key.includes("museum") || key.includes("theatre") || key.includes("monument"))
    return <Building className="h-4 w-4" />
  return <Info className="h-4 w-4" />
}

// Format field labels
const formatLabel = (key: string): string => {
  if (labelMapping[key]) return labelMapping[key]

  // Auto-format unknown keys
  return key
    .split(/[_:]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Format field values
const formatValue = (key: string, value: unknown): string => {
  if (typeof value !== "string") return String(value)

  // Special formatting for specific fields
  if (key === "wheelchair") {
    switch (value.toLowerCase()) {
      case "yes":
        return "Fully Accessible"
      case "no":
        return "Not Accessible"
      case "limited":
        return "Limited Access"
      default:
        return value
    }
  }

  if (
    key.includes("diet:") ||
    key.includes("payment:") ||
    key === "toilets" ||
    key === "takeaway" ||
    key === "delivery"
  ) {
    return value.toLowerCase() === "yes" ? "Available" : value.toLowerCase() === "no" ? "Not Available" : value
  }

  return value
}

// Check if a field should be displayed as a link
const isLinkField = (key: string): boolean => {
  return key.includes("website") || key.includes("wikidata") || key.includes("wikipedia")
}

// Format URL for display
const formatUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
    return urlObj.hostname
  } catch {
    return url
  }
}

export function SiteDetailsModal({ site, open, onOpenChange }: SiteDetailsModalProps) {
  const [showRawData, setShowRawData] = useState(false)

  if (!site) return null

  // Construct address from tags
  const constructAddress = () => {
    const parts = []
    if (site.tags?.["addr:street"] && site.tags?.["addr:housenumber"]) {
      parts.push(`${site.tags["addr:street"]} ${site.tags["addr:housenumber"]}`)
    } else if (site.tags?.["addr:street"]) {
      parts.push(site.tags["addr:street"])
    }

    if (site.tags?.["addr:postcode"] && site.tags?.["addr:city"]) {
      parts.push(`${site.tags["addr:postcode"]} ${site.tags["addr:city"]}`)
    } else if (site.tags?.["addr:city"]) {
      parts.push(site.tags["addr:city"])
    }

    return parts.length > 0 ? parts.join(", ") : site.address || null
  }

  // Get curated fields organized by category
  const getCuratedFields = () => {
    const fields = {
      contact: {} as Record<string, unknown>,
      facilities: {} as Record<string, unknown>,
      food: {} as Record<string, unknown>,
      cultural: {} as Record<string, unknown>,
      payment: {} as Record<string, unknown>,
      diet: {} as Record<string, unknown>,
    }

    if (!site.tags) return fields

    Object.entries(site.tags).forEach(([key, value]) => {
      if (!value || value === "no") return

      // Contact & Opening Hours
      if (
        ["opening_hours", "contact:phone", "phone", "contact:email", "email", "contact:website", "website"].includes(
          key,
        )
      ) {
        fields.contact[key] = value
      }

      // Facilities & Accessibility
      else if (
        ["wheelchair", "toilets", "biergarten", "changing_table", "air_conditioning", "internet_access"].includes(key)
      ) {
        fields.facilities[key] = value
      }

      // Food & Services
      else if (["cuisine", "takeaway", "delivery", "lunch", "reservation"].includes(key)) {
        fields.food[key] = value
      }

      // Cultural & Attribution
      else if (
        [
          "wikidata",
          "wikipedia",
          "artist_name",
          "material",
          "year_of_construction",
          "museum_type",
          "theatre:type",
          "monument",
          "inscription",
          "heritage",
        ].includes(key)
      ) {
        fields.cultural[key] = value
      }

      // Payment methods
      else if (key.startsWith("payment:")) {
        fields.payment[key] = value
      }

      // Diet options
      else if (key.startsWith("diet:")) {
        fields.diet[key] = value
      }
    })

    return fields
  }

  const curatedFields = getCuratedFields()
  const constructedAddress = constructAddress()

  // Get payment methods summary
  const getPaymentSummary = () => {
    const payments = Object.entries(curatedFields.payment)
      .filter(([, value]) => value === "yes")
      .map(([key]) => formatLabel(key))

    return payments.length > 0 ? `Accepted: ${payments.join(", ")}` : null
  }

  // Get diet options summary
  const getDietSummary = () => {
    const diets = Object.entries(curatedFields.diet)
      .filter(([, value]) => value === "yes")
      .map(([key]) => formatLabel(key))

    return diets.length > 0 ? diets.join(", ") : null
  }

  const renderField = (key: string, value: string | number | boolean | null | undefined) => {
    const icon = getFieldIcon(key)
    const label = formatLabel(key)
    const formattedValue = formatValue(key, value)
    const isLink = isLinkField(key)

    return (
      <div key={key} className="flex items-start gap-3 py-2">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {isLink ? (
            <a
              href={
                typeof value === "string"
                  ? value.startsWith("http")
                    ? value
                    : `https://${value}`
                  : undefined
        }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {formatUrl(String(value))}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <div className="text-sm text-muted-foreground">{formattedValue}</div>
          )}
        </div>
      </div>
    )
  }

  const renderSection = (title: string, fields: Record<string, unknown>, icon: React.ReactNode) => {
    const hasFields = Object.keys(fields).length > 0

    if (!hasFields) return null

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <div className="space-y-1">{Object.entries(fields as Record<string, string | number | boolean | null | undefined>).map(([key, value]) =>
        renderField(key, value))}</div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="space-y-4">
              <div className="space-y-2">
                <DialogTitle className="text-2xl">{site.name}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {site.category}
                  </Badge>
                </div>
              </div>

              {site.description && (
                <DialogDescription className="text-base leading-relaxed">{site.description}</DialogDescription>
              )}
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Address */}
              {constructedAddress && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">Location</h3>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <div className="text-muted-foreground mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Address</div>
                      <div className="text-sm text-muted-foreground">{constructedAddress}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Opening Hours */}
              {renderSection("Contact & Hours", curatedFields.contact, <Phone className="h-5 w-5" />)}

              {/* Facilities & Accessibility */}
              {renderSection(
                "Facilities & Accessibility",
                curatedFields.facilities,
                <Wheelchair className="h-5 w-5" />,
              )}

              {/* Food & Services */}
              {renderSection("Food & Services", curatedFields.food, <Utensils className="h-5 w-5" />)}

              {/* Payment Methods */}
              {getPaymentSummary() && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">Payment</h3>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <div className="text-muted-foreground mt-0.5">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Payment Methods</div>
                      <div className="text-sm text-muted-foreground">{getPaymentSummary()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Diet Options */}
              {getDietSummary() && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">Dietary Options</h3>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <div className="text-muted-foreground mt-0.5">
                      <Coffee className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Available Options</div>
                      <div className="text-sm text-muted-foreground">{getDietSummary()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cultural & Attribution */}
              {renderSection("Cultural Details", curatedFields.cultural, <Building className="h-5 w-5" />)}

              <Separator />

              {/* Raw Data Section */}
              <Collapsible open={showRawData} onOpenChange={setShowRawData}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      <span className="font-semibold text-lg">More Details</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showRawData ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-4">
                  <div className="text-sm text-muted-foreground mb-3">
                    Complete OpenStreetMap data for this location
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                    {site.tags &&
                      Object.entries(site.tags as Record<string, string | number | boolean | null | undefined>).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start gap-4 text-xs">
                          <code className="font-mono text-muted-foreground bg-background px-2 py-1 rounded">{key}</code>
                          <span className="text-right break-all">{String(value)}</span>
                        </div>
                      ))}
                    {(!site.tags || Object.keys(site.tags).length === 0) && (
                      <div className="text-sm text-muted-foreground text-center py-4">No additional data available</div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
