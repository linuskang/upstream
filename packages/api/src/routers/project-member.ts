import { TRPCError } from "@trpc/server"
import crypto from "node:crypto"
import { z } from "zod"
import type { PrismaClient } from "@workspace/db"
import { router, protectedProcedure } from "../trpc"
import { requireProjectAccess } from "../permissions"
import { getPlan } from "../subscription-types"

const INVITE_EXPIRY_DAYS = 7

export const projectMemberRouter = router({
  myInvites: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { email: true },
    })

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
    }

    const invitations = await ctx.db.projectInvitation.findMany({
      where: {
        email: user.email.toLowerCase().trim(),
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        token: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return invitations.map((invitation) => ({
      ...invitation,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
    }))
  }),

  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.db, input.projectId, ctx.session.user.id, "VIEW")

      const [members, invitations] = await Promise.all([
        ctx.db.projectMember.findMany({
          where: { projectId: input.projectId },
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.projectInvitation.findMany({
          where: { projectId: input.projectId, status: "PENDING" },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            expiresAt: true,
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ])

      return {
        members: members.map((member) => ({
          ...member,
          createdAt: member.createdAt.toISOString(),
        })),
        invitations: invitations.map((invitation) => ({
          ...invitation,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
        })),
      }
    }),

  invite: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const normalizedEmail = input.email.toLowerCase().trim()

      await requireProjectAccess(ctx.db, input.projectId, userId, "ADMIN")

      const [projectWithMembers, existingUser, existingInvite] = await Promise.all([
        ctx.db.project.findUnique({
          where: { id: input.projectId },
          select: {
            name: true,
            members: {
              select: { id: true },
            },
            invitations: {
              where: { status: "PENDING" },
              select: { id: true },
            },
          },
        }),
        ctx.db.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        }),
        ctx.db.projectInvitation.findFirst({
          where: {
            projectId: input.projectId,
            email: normalizedEmail,
            status: "PENDING",
          },
          select: { id: true },
        }),
      ])

      const existingMember = existingUser
        ? await ctx.db.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: input.projectId,
                userId: existingUser.id,
              },
            },
            select: { id: true },
          })
        : null

      if (!projectWithMembers) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
      }

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This user is already a member of the project",
        })
      }

      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An active invitation already exists for this email",
        })
      }

      const owner = await ctx.db.projectMember.findFirst({
        where: { projectId: input.projectId, role: "OWNER" },
        select: { userId: true, user: { select: { plan: true } } },
      })

      if (!owner) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
      }

      const plan = getPlan(owner.user.plan)
      const currentSeats =
        projectWithMembers.members.length + projectWithMembers.invitations.length

      if (currentSeats >= plan.maxMembersPerProject) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Member limit reached. Upgrade to Pro for more seats.`,
        })
      }

      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

      const invitation = await ctx.db.projectInvitation.create({
        data: {
          projectId: input.projectId,
          email: normalizedEmail,
          role: input.role,
          token,
          invitedById: userId,
          expiresAt,
        },
        select: {
          id: true,
          token: true,
          email: true,
          role: true,
          expiresAt: true,
        },
      })

      const inviteUrl = `${process.env.BASE_URL ?? ""}/invite?token=${token}`

      await ctx.sendEmail(
        invitation.email,
        `You've been invited to join ${projectWithMembers.name} on Upstream`,
        `You've been invited to join ${projectWithMembers.name} as a ${input.role}.\n\nAccept the invitation: ${inviteUrl}\n\nThis invitation expires in ${INVITE_EXPIRY_DAYS} days.`,
        `<p>You've been invited to join <strong>${projectWithMembers.name}</strong> as a <strong>${input.role}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This invitation expires in ${INVITE_EXPIRY_DAYS} days.</p>`
      )

      await ctx.db.auditLog.create({
        data: {
          projectId: input.projectId,
          userId,
          message: `Invited ${normalizedEmail} as ${input.role}`,
        },
      })

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      }
    }),

  cancelInvite: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        invitationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      await requireProjectAccess(ctx.db, input.projectId, userId, "ADMIN")

      const invitation = await ctx.db.projectInvitation.findFirst({
        where: {
          id: input.invitationId,
          projectId: input.projectId,
          status: "PENDING",
        },
        select: { email: true, role: true },
      })

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        })
      }

      await ctx.db.projectInvitation.update({
        where: { id: input.invitationId },
        data: { status: "REVOKED" },
      })

      await ctx.db.auditLog.create({
        data: {
          projectId: input.projectId,
          userId,
          message: `Revoked invitation for ${invitation.email}`,
        },
      })

      return { id: input.invitationId }
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        userId: z.string(),
        role: z.enum(["ADMIN", "MEMBER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id
      await requireProjectAccess(ctx.db, input.projectId, actorId, "ADMIN")

      if (input.userId === actorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own role",
        })
      }

      const member = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        select: { role: true, user: { select: { email: true } } },
      })

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" })
      }

      if (member.role === "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The project owner's role cannot be changed",
        })
      }

      await ctx.db.projectMember.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: { role: input.role },
      })

      await ctx.db.auditLog.create({
        data: {
          projectId: input.projectId,
          userId: actorId,
          message: `Changed ${member.user.email} role to ${input.role}`,
        },
      })

      return { userId: input.userId, role: input.role }
    }),

  remove: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id
      await requireProjectAccess(ctx.db, input.projectId, actorId, "ADMIN")

      if (input.userId === actorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Use leave project to remove yourself",
        })
      }

      const member = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        select: { role: true, user: { select: { email: true } } },
      })

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" })
      }

      if (member.role === "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The project owner cannot be removed",
        })
      }

      await ctx.db.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      })

      await ctx.db.auditLog.create({
        data: {
          projectId: input.projectId,
          userId: actorId,
          message: `Removed ${member.user.email} from the project`,
        },
      })

      return { userId: input.userId }
    }),

  leave: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const member = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId,
          },
        },
        select: {
          role: true,
          user: { select: { email: true } },
        },
      })

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
      }

      if (member.role === "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The project owner cannot leave. Transfer ownership or delete the project instead.",
        })
      }

      await ctx.db.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId,
          },
        },
      })

      await ctx.db.auditLog.create({
        data: {
          projectId: input.projectId,
          userId,
          message: `${member.user.email} left the project`,
        },
      })

      return { projectId: input.projectId }
    }),

  getInvite: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { token: input.token },
        select: {
          email: true,
          role: true,
          status: true,
          expiresAt: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" })
      }

      if (invitation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This invitation has already been ${invitation.status.toLowerCase()}`,
        })
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        })
      }

      return {
        projectId: invitation.project.id,
        projectName: invitation.project.name,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      }
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
      }

      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { token: input.token },
        include: {
          project: {
            select: { name: true },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" })
      }

      if (invitation.status !== "PENDING") {
        const existingMember = await ctx.db.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: invitation.projectId,
              userId,
            },
          },
          select: { role: true },
        })

        if (
          invitation.status === "ACCEPTED" &&
          existingMember
        ) {
          return {
            projectId: invitation.projectId,
            projectName: invitation.project.name,
            role: existingMember.role,
          }
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This invitation has already been ${invitation.status.toLowerCase()}`,
        })
      }

      if (invitation.expiresAt < new Date()) {
        await ctx.db.projectInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        })
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        })
      }

      const normalizedUserEmail = user.email.toLowerCase().trim()
      if (invitation.email !== normalizedUserEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        })
      }

      const existingMember = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: invitation.projectId,
            userId,
          },
        },
      })

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this project",
        })
      }

      await ctx.db.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId,
          role: invitation.role,
        },
      })

      await ctx.db.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      })

      await ctx.db.auditLog.create({
        data: {
          projectId: invitation.projectId,
          userId,
          message: `${user.email} accepted the invitation and joined as ${invitation.role}`,
        },
      })

      return {
        projectId: invitation.projectId,
        projectName: invitation.project.name,
        role: invitation.role,
      }
    }),

  declineInvite: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
      }

      const invitation = await ctx.db.projectInvitation.findUnique({
        where: { token: input.token },
        include: {
          project: {
            select: { name: true },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" })
      }

      if (invitation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This invitation has already been ${invitation.status.toLowerCase()}`,
        })
      }

      const normalizedUserEmail = user.email.toLowerCase().trim()
      if (invitation.email !== normalizedUserEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        })
      }

      await ctx.db.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "REVOKED" },
      })

      await ctx.db.auditLog.create({
        data: {
          projectId: invitation.projectId,
          userId,
          message: `${user.email} declined the invitation`,
        },
      })

      return {
        projectId: invitation.projectId,
        projectName: invitation.project.name,
      }
    }),
})
