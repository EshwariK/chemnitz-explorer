import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/lib/auth-options"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const location = await UserService.getUserLocation(session.user.id)
    return NextResponse.json({ location })
  } catch (error) {
    console.error("Error fetching user location:", error)
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
    const { lat, lng, accuracy, address } = body

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
    }

    const locationData = {
      lat: Number.parseFloat(lat),
      lng: Number.parseFloat(lng),
      accuracy: accuracy ? Number.parseFloat(accuracy) : undefined,
      address,
      lastUpdated: new Date(),
    }

    await UserService.updateUserLocation(session.user.id, locationData)

    return NextResponse.json({
      success: true,
      location: locationData,
      message: "Location updated successfully",
    })
  } catch (error) {
    console.error("Error updating user location:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
