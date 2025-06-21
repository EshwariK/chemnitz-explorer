import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/lib/auth-options"

/**
 * @swagger
 * /api/user/favorites:
 *   get:
 *     summary: Get user's favorite sites
 *     tags: [Favorites]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [category]
 *         description: Group favorites by category
 *     responses:
 *       200:
 *         description: List of user's favorites
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Favorite'
 *                 - type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Favorite'
 *       401:
 *         description: Unauthorized
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
 *   post:
 *     summary: Add a site to favorites
 *     tags: [Favorites]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteId
 *               - siteName
 *               - category
 *             properties:
 *               siteId:
 *                 type: string
 *                 description: Cultural site ID
 *               siteName:
 *                 type: string
 *                 description: Name of the site
 *               category:
 *                 type: string
 *                 description: Site category
 *               description:
 *                 type: string
 *                 description: Site description
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       200:
 *         description: Site added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
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
 *   delete:
 *     summary: Remove a site from favorites
 *     tags: [Favorites]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID to remove from favorites
 *     responses:
 *       200:
 *         description: Site removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Site ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
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
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const groupBy = url.searchParams.get("groupBy")

    if (groupBy === "category") {
      const favoritesByCategory = await UserService.getFavoritesByCategory(session.user.id)
      return NextResponse.json(favoritesByCategory)
    }

    const favorites = await UserService.getUserFavorites(session.user.id)
    return NextResponse.json(favorites)
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { siteId, siteName, category, description, coordinates } = body

    if (!siteId || !siteName || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await UserService.addFavorite(session.user.id, {
      siteId,
      siteName,
      category,
      description: description || "",
      coordinates: coordinates || { lat: 0, lng: 0 },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error adding favorite:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const siteId = url.searchParams.get("siteId")

    if (!siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 })
    }

    const result = await UserService.removeFavorite(session.user.id, siteId)
    return NextResponse.json({ success: result })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
