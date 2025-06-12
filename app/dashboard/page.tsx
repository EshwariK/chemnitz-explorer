import { DashboardStats } from "@/components/dashboard-stats"
import { RecentActivity } from "@/components/recent-activity"
import { BarChart3 } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Track your cultural exploration journey</p>
      </div>
      <div className="space-y-8">
        <DashboardStats />
        <RecentActivity />
      </div>
    </div>
  )
}
