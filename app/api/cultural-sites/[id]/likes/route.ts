import { type NextRequest, NextResponse } from "next/server"
import { CulturalSitesService } from "@/lib/cultural-sites-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const siteId = (await params).id
    const likesCount = await CulturalSitesService.getSiteLikesCount(siteId)

    return NextResponse.json({ count: likesCount })
  } catch (error) {
    console.error("Error fetching likes count:", error)
    return NextResponse.json({ error: "Failed to fetch likes count" }, { status: 500 })
  }
}
