import { type NextRequest, NextResponse } from "next/server"
import { CulturalSitesService } from "@/lib/cultural-sites-service"

/**
 * @swagger
 * /api/cultural-sites/{id}:
 *   get:
 *     summary: Get a cultural site by ID
 *     tags: [Cultural Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cultural site ID
 *     responses:
 *       200:
 *         description: Cultural site details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CulturalSite'
 *       404:
 *         description: Cultural site not found
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
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const site = await CulturalSitesService.getCulturalSiteById(params.id)

    if (!site) {
      return NextResponse.json({ error: "Cultural site not found", code: "NOT_FOUND" }, { status: 404 })
    }

    return NextResponse.json(site)
  } catch (error) {
    console.error("Error fetching cultural site:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
