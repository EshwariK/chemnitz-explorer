import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const activities = await UserService.getUserActivities(session.user.id)
    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
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
    const { type, siteId, siteName, category } = body

    const activityId = await UserService.addActivity(session.user.id, {
      type,
      siteId,
      siteName,
      category,
    })

    return NextResponse.json({ success: true, activityId })
  } catch (error) {
    console.error("Error adding activity:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
