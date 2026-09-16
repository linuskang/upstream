import { prisma } from "@workspace/db"
import { getSession } from "@/server/auth"
import { ApiResponse } from "@/app/api/responses"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: {
      id,
      ownerId: session.user.id,
    },
  })

  if (!project) {
    return ApiResponse.NotFound()
  }

  const requestLogs = await prisma.requestLog.findMany({
    where: {
      projectId: id,
    },
  })

  return ApiResponse.Success(undefined, requestLogs)
}
