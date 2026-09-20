import { TRPCError } from "@trpc/server"
import type { PrismaClient, ProjectMemberRole } from "@workspace/db"

export const ProjectPermission = {
  VIEW: 1,
  EDIT: 2,
  ADMIN: 3,
  OWNER: 4,
} as const

const roleLevel: Record<ProjectMemberRole, number> = {
  OWNER: ProjectPermission.OWNER,
  ADMIN: ProjectPermission.ADMIN,
  MEMBER: ProjectPermission.VIEW,
}

export function hasPermission(
  role: ProjectMemberRole,
  required: keyof typeof ProjectPermission
) {
  return roleLevel[role] >= ProjectPermission[required]
}

export async function requireProjectAccess(
  db: PrismaClient,
  projectId: string,
  userId: string,
  required: keyof typeof ProjectPermission = "VIEW"
) {
  const member = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: {
      role: true,
    },
  })

  if (!member || !hasPermission(member.role, required)) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    })
  }

  return member.role
}

export async function getProjectRole(
  db: PrismaClient,
  projectId: string,
  userId: string
): Promise<ProjectMemberRole | null> {
  const member = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: {
      role: true,
    },
  })

  return member?.role ?? null
}
