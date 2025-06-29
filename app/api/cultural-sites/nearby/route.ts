import { type NextRequest, NextResponse } from "next/server"
import { CulturalSitesService } from "@/lib/cultural-sites-service"

/**
 * @swagger
 * /api/cultural-sites/nearby:
 *   get:
 *     summary: Get cultural sites near a location
 *     description: Find cultural sites within a specified radius of given coordinates. All query parameters are received as strings and parsed to numbers.
 *     tags: [Cultural Sites]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: string
 *           format: float
 *         description: Latitude of the center point
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: string
 *           format: float
 *         description: Longitude of the center point
 *       - in: query
 *         name: radius
 *         schema:
 *           type: string
 *           format: float
 *           default: "5"
 *         description: Search radius in kilometers
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           format: integer
 *           default: "20"
 *           maximum: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of nearby cultural sites with distances
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/CulturalSite'
 *                   - type: object
 *                     properties:
 *                       distance:
 *                         type: number
 *                         description: Distance in kilometers
 *       400:
 *         description: Bad request - missing or invalid coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required", code: "MISSING_COORDINATES" },
        { status: 400 },
      )
    }

    const latitude = Number.parseFloat(lat)
    const longitude = Number.parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: "Invalid coordinates", code: "INVALID_COORDINATES" }, { status: 400 })
    }

    const radius = Number.parseFloat(searchParams.get("radius") || "5")
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20")))

    const sites = await CulturalSitesService.getCulturalSitesNearby(latitude, longitude, radius, limit)

    return NextResponse.json(sites)
  } catch (error) {
    console.error("Error fetching nearby cultural sites:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
