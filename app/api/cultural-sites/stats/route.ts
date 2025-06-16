import { NextResponse } from "next/server"
import { CulturalSitesService } from "@/lib/cultural-sites-service"

/**
 * @swagger
 * /api/cultural-sites/stats:
 *   get:
 *     summary: Get statistics about cultural sites
 *     tags: [Cultural Sites]
 *     responses:
 *       200:
 *         description: Statistics about the cultural sites database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSites:
 *                   type: number
 *                   description: Total number of cultural sites
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       count:
 *                         type: number
 *                 accessibleSites:
 *                   type: number
 *                   description: Number of wheelchair accessible sites
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: When the statistics were last calculated
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const stats = await CulturalSitesService.getStatistics()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
