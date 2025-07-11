import { type NextRequest, NextResponse } from "next/server"
import { CulturalSitesService } from "@/lib/cultural-sites-service"
import type { SearchFilters } from "@/lib/cultural-sites-service"

/**
 * @swagger
 * /api/cultural-sites:
 *   get:
 *     summary: Get cultural sites with filtering and pagination
 *     description: Get cultural sites with optional filtering and pagination. All query parameters are received as strings and parsed internally.
 *     tags: [Cultural Sites]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           format: integer
 *           default: "1"
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           format: integer
 *           default: "20"
 *           maximum: 1000
 *         description: Number of results per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (use /api/cultural-sites/categories to get available categories)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for site names and descriptions
 *       - in: query
 *         name: north
 *         schema:
 *           type: string
 *           format: float
 *         description: Northern boundary for geographic filtering
 *       - in: query
 *         name: south
 *         schema:
 *           type: string
 *           format: float
 *         description: Southern boundary for geographic filtering
 *       - in: query
 *         name: east
 *         schema:
 *           type: string
 *           format: float
 *         description: Eastern boundary for geographic filtering
 *       - in: query
 *         name: west
 *         schema:
 *           type: string
 *           format: float
 *         description: Western boundary for geographic filtering
 *       - in: query
 *         name: wheelchair
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter for wheelchair accessible sites (converted to accessibility.wheelchair = "yes")
 *       - in: query
 *         name: parking
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter for sites with parking
 *     responses:
 *       200:
 *         description: Paginated list of cultural sites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse pagination parameters
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(1000, Math.max(1, Number.parseInt(searchParams.get("limit") || "20")))

    // Parse filter parameters
    const filters: SearchFilters = {}

    const category = searchParams.get("category")
    if (category) {
      filters.category = category
    }

    const search = searchParams.get("search")
    if (search) {
      filters.search = search
    }

    // Geographic bounds
    const north = searchParams.get("north")
    const south = searchParams.get("south")
    const east = searchParams.get("east")
    const west = searchParams.get("west")

    if (north && south && east && west) {
      filters.bounds = {
        north: Number.parseFloat(north),
        south: Number.parseFloat(south),
        east: Number.parseFloat(east),
        west: Number.parseFloat(west),
      }
    }

    // Accessibility filters
    const wheelchair = searchParams.get("wheelchair")
    const parking = searchParams.get("parking")

    if (wheelchair || parking) {
      filters.accessibility = {}
      if (wheelchair === "true") {
        filters.accessibility.wheelchair = true
      }
      if (parking === "true") {
        filters.accessibility.parking = true
      }
    }

    const result = await CulturalSitesService.getCulturalSites(filters, { page, limit })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching cultural sites:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
