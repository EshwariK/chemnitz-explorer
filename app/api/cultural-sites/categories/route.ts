import { NextResponse } from "next/server"
import { CulturalSitesService } from "@/lib/cultural-sites-service"

/**
 * @swagger
 * /api/cultural-sites/categories:
 *   get:
 *     summary: Get all categories with site counts
 *     tags: [Cultural Sites]
 *     responses:
 *       200:
 *         description: List of categories with counts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: Category name
 *                   count:
 *                     type: number
 *                     description: Number of sites in this category
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const categories = await CulturalSitesService.getCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
