import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/lib/auth-options"

/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     summary: Delete user account
 *     description: |
 *       Permanently delete the authenticated user's account and all associated data. This action cannot be undone.
 *       
 *       **Data deleted includes:**
 *       - User profile and account information
 *       - All favorite cultural sites
 *       - Activity history and site interactions
 *       - User memories and uploads
 *       - Associated authentication accounts
 *       
 *       **Session handling:**
 *       - Immediately invalidates user session
 *       - Clears authentication cookies
 *       - User will be automatically logged out
 *       
 *       **Important:** This operation is irreversible and the user will need to create a new account to use the service again.
 *     tags: [User Management]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully and session invalidated
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
 *         headers:
 *           Set-Cookie:
 *             description: Clears authentication session cookies
 *             schema:
 *               type: string
 *               example: "next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized"
 *               code: "UNAUTHORIZED"
 *       500:
 *         description: Internal server error - Failed to delete account or invalidate session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               delete_failed:
 *                 summary: Account deletion failed
 *                 value:
 *                   error: "Failed to delete user account"
 *                   code: "DELETE_FAILED"
 *               internal_error:
 *                 summary: Server error
 *                 value:
 *                   error: "Internal Server Error"
 *                   code: "INTERNAL_ERROR"
 */
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const success = await UserService.deleteUser(session.user.id)
    
    if (success) {
      // Clear all NextAuth cookies to invalidate the session
      const sessionCookieName = process.env.NEXTAUTH_URL?.includes('localhost') 
        ? 'next-auth.session-token' 
        : '__Secure-next-auth.session-token'
      const csrfCookieName = process.env.NEXTAUTH_URL?.includes('localhost')
        ? 'next-auth.csrf-token'
        : '__Secure-next-auth.csrf-token'
      
      const response = NextResponse.json({ 
        success: true, 
        message: "User account deleted successfully" 
      })
      
      // Clear session cookies
      response.cookies.delete(sessionCookieName)
      response.cookies.delete(csrfCookieName)
      
      return response
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
