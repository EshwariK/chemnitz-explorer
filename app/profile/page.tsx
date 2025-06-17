import { requireAuth } from "@/lib/auth"
import { UserProfile } from "@/components/user-profile"
import { UserService } from "@/lib/user-service"

export default async function ProfilePage() {
  const user = await requireAuth()

  // Get user's current profile data including location
  const dashboardData = await UserService.getUserDashboardData(user.id)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and location settings</p>
      </div>
      <UserProfile user={user} initialData={dashboardData} />
    </div>
  )
}
