import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { MemoryService } from "@/lib/memory-service"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const memory = await MemoryService.getMemoryById(id)

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    return NextResponse.json(memory)
  } catch (error) {
    console.error("Error fetching memory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const updates = await request.json()
    const success = await MemoryService.updateMemory(id, session.user.id, updates)

    if (!success) {
      return NextResponse.json({ error: "Memory not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Memory updated successfully" })
  } catch (error) {
    console.error("Error updating memory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const success = await MemoryService.deleteMemory(id, session.user.id)

    if (!success) {
      return NextResponse.json({ error: "Memory not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Memory deleted successfully" })
  } catch (error) {
    console.error("Error deleting memory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
