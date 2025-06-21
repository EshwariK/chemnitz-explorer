import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/lib/auth-options"

/**
 * @swagger
 * /api/user/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [User Management]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFavorites:
 *                   type: number
 *                   description: Total number of favorite sites
 *                 totalMemories:
 *                   type: number
 *                   description: Total number of memories created
 *                 totalActivities:
 *                   type: number
 *                   description: Total number of activities
 *                 favoriteCategories:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   description: Count of favorites by category
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *                   description: Recent user activities
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const stats = await UserService.getUserStats(session.user.id)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
