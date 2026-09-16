import { getSession } from "@/server/auth"
import { prisma } from "@workspace/db"
import { NextRequest } from "next/server"
import { ApiResponse } from "@/app/api/responses"

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const { id } = await params

  const project = await prisma.project.findFirst({
    where: {
      id: id,
      ownerId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  const totalCount = await prisma.event.count({
    where: { projectId: id },
  })

  const grouped = await prisma.event.groupBy({
    by: ["category"],
    where: { projectId: id },
    _count: { id: true },
  })

  const categories = grouped.map((g) => ({
    name: g.category ?? "none",
    count: g._count.id,
  }))

  return ApiResponse.Success(undefined, {
    total: totalCount,
    categories,
  })
}
