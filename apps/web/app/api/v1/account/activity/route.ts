import { getSession } from "@/server/auth"
import { prisma } from "@workspace/db"
import { ApiResponse } from "@/app/api/responses"

export async function GET() {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const activities = await prisma.auditLog.findMany({
    where: {
      project: {
        ownerId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  })

  return ApiResponse.Success(undefined, activities)
}
