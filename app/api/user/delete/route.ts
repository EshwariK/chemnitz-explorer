import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/lib/auth-options"

/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the authenticated user's account and all associated data including profile, favorites, activities, and memories. This action cannot be undone.
 *     tags: [User Management]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User account deleted successfully"
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
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const success = await UserService.deleteUser(session.user.id)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "User account deleted successfully" 
      })
    } else {
      return NextResponse.json({ 
        error: "Failed to delete user account", 
        code: "DELETE_FAILED" 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting user account:", error)
    return NextResponse.json({ 
      error: "Internal Server Error", 
      code: "INTERNAL_ERROR" 
    }, { status: 500 })
  }
}
