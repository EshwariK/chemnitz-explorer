import { requireAuth } from "@/lib/auth"
import { UserService } from "@/lib/user-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FavoritesList } from "@/components/favorites-list"
import { DeleteUserButton } from "@/components/delete-user-button"

export default async function ProfilePage() {
  const user = await requireAuth()

  // Get user's dashboard data for favorite categories
  const dashboardData = await UserService.getUserDashboardData(user.id)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Your account and favorite cultural sites</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Left Column - User Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                <AvatarFallback>{user.name ? getInitials(user.name) : "U"}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-medium text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Delete User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <DeleteUserButton />
            </CardContent>
          </Card>

          {/* Favorite Categories */}
          {dashboardData.stats.favoriteCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Favorite Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dashboardData.stats.favoriteCategories.map((cat) => (
                    <Badge key={cat.category} variant="secondary">
                      {cat.category} ({cat.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Favorites */}
        <div className="lg:col-span-3">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Your Favorites</h2>
            <p className="text-muted-foreground">Cultural sites you&apos;ve saved for later exploration</p>
          </div>
          <FavoritesList />
        </div>
      </div>
    </div>
  )
}
