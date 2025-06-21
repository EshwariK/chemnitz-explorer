import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { MemoryService } from "@/lib/memory-service"
import { authOptions } from "@/lib/auth-options"

/**
 * @swagger
 * /api/memories/{id}:
 *   get:
 *     summary: Get a specific memory by ID
 *     tags: [Memories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Memory ID
 *     responses:
 *       200:
 *         description: Memory details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Memory'
 *       404:
 *         description: Memory not found
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
 *   put:
 *     summary: Update a memory
 *     tags: [Memories]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Memory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               note:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Memory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Memory not found or unauthorized
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
 *   delete:
 *     summary: Delete a memory
 *     tags: [Memories]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Memory ID
 *     responses:
 *       200:
 *         description: Memory deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Memory not found or unauthorized
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
