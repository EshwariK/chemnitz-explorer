import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { UserService } from "@/lib/user-service"
import { authOptions } from "@/lib/auth-options"

/**
 * @swagger
 * /api/user/location:
 *   get:
 *     summary: Get user's saved location
 *     description: Retrieve the user's last saved location data including coordinates and address. Returns null if no location has been saved.
 *     tags: [User Management]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User's location data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *                     accuracy:
 *                       type: number
 *                     address:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
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
 *   post:
 *     summary: Update user's location
 *     description: Save or update the user's location with coordinates and optional metadata. lat and lng are required and parsed to numbers.
 *     tags: [User Management]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *                 description: Latitude
 *               lng:
 *                 type: number
 *                 description: Longitude
 *               accuracy:
 *                 type: number
 *                 description: Location accuracy in meters
 *               address:
 *                 type: string
 *                 description: Human-readable address
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 location:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const location = await UserService.getUserLocation(session.user.id)
    return NextResponse.json({ location })
  } catch (error) {
    console.error("Error fetching user location:", error)
    return NextResponse.json({ error: "Internal Server Error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { lat, lng, accuracy, address } = body

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude are required", code: "BAD_REQUEST" }, { status: 400 })
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
    })  } catch (error) {
    console.error("Error updating user location:", error)
    return NextResponse.json({ error: "Internal Server Error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
