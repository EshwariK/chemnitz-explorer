import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "./auth-options"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Check if user still exists in database
  try {
    const { UserService } = await import("./user-service")
    const userExists = await UserService.userExists(session.user.id)
    
    if (!userExists) {
      // User was deleted, redirect to login
      redirect("/login")
    }
  } catch (error) {
    console.error("Error checking user existence:", error)
    // On error, redirect to login to be safe
    redirect("/login")
  }

  return session.user
}
