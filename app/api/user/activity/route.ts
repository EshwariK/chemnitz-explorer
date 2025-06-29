import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/lib/auth-options"

/**
 * @swagger
 * /api/user/activity:
 *   get:
 *     summary: Get user's activity history
 *     description: Retrieve the user's activity history including visits, favorites, memories, and searches. Activities are typically ordered by creation date.
 *     tags: [Activities]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of user activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
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
 *     summary: Add a new activity
 *     description: Record a new user activity such as visiting a site, adding to favorites, creating a memory, or performing a search. All fields are required.
 *     tags: [Activities]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - siteId
 *               - siteName
 *               - category
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [visit, favorite, memory, search]
 *                 description: Type of activity
 *               siteId:
 *                 type: string
 *                 description: Cultural site ID
 *               siteName:
 *                 type: string
 *                 description: Name of the site
 *               category:
 *                 type: string
 *                 description: Site category
 *     responses:
 *       200:
 *         description: Activity added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 activityId:
 *                   type: string
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
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const activities = await UserService.getUserActivities(session.user.id)
    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Internal Server Error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { type, siteId, siteName, category } = body

    if (!type || !siteId || !siteName || !category) {
      return NextResponse.json({ error: "Missing required fields", code: "BAD_REQUEST" }, { status: 400 })
    }

    const activityId = await UserService.addActivity(session.user.id, {
      type,
      siteId,
      siteName,
      category,
    })

    return NextResponse.json({ success: true, activityId })
  } catch (error) {
    console.error("Error adding activity:", error)
    return NextResponse.json({ error: "Internal Server Error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
