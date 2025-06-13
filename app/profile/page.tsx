import { requireAuth } from "@/lib/auth"
import { UserProfile } from "@/components/user-profile"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  try {
    const user = await requireAuth()

    return (
        <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <UserProfile user={user} />
        </div>
    )
  } catch (error) {
    console.error("Profile page error:", error)
    redirect("/login")
  }
}
