import { NextRequest } from "next/server"
import { getSession } from "@/server/auth"
import { Project } from "@/server/project"
import { plans } from "@/subscription-types"
import { prisma } from "@workspace/db"
import { ApiResponse } from "@/app/api/responses"

export async function GET() {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const projects = await prisma.project.findMany({
    where: {
      ownerId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
  })

  return ApiResponse.Success(undefined, projects)
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return ApiResponse.Unauthorized()
  }

  const body = await request.json()

  if (!body.name) {
    return ApiResponse.BadRequest()
  }

  // Check project quota
  const projectCount = await Project.count(session.user.id)
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      plan: true,
    },
  })

  if (!user) {
    return ApiResponse.NotFound()
  }

  const userPlan = user.plan as keyof typeof plans
  const limit = plans[userPlan].maxProjects

  if (projectCount >= limit) {
    return ApiResponse.Forbidden(
      "Project limit reached. Upgrade your plan to create more projects."
    )
  }

  const newProject = await Project.create(session.user.id, body.name)
  await Project.log(
    newProject.id,
    session.user.id,
    `Created project ${body.name}`
  )

  return ApiResponse.Success(undefined, newProject)
}
