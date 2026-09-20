-- CreateEnum
CREATE TYPE "ProjectMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ProjectInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "project_member" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_invitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ProjectMemberRole" NOT NULL,
    "token" TEXT NOT NULL,
    "status" "ProjectInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "project_invitation_pkey" PRIMARY KEY ("id")
);

-- Backfill existing owners into project_member
INSERT INTO "project_member" ("id", "projectId", "userId", "role", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", "ownerId", 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Project";

-- CreateIndex
CREATE UNIQUE INDEX "project_member_projectId_userId_key" ON "project_member"("projectId", "userId");

-- CreateIndex
CREATE INDEX "project_member_userId_idx" ON "project_member"("userId");

-- CreateIndex
CREATE INDEX "project_member_projectId_idx" ON "project_member"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_single_owner_idx" ON "project_member"("projectId") WHERE "role" = 'OWNER';

-- CreateIndex
CREATE UNIQUE INDEX "project_invitation_token_key" ON "project_invitation"("token");

-- CreateIndex
CREATE INDEX "project_invitation_projectId_idx" ON "project_invitation"("projectId");

-- CreateIndex
CREATE INDEX "project_invitation_token_idx" ON "project_invitation"("token");

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_ownerId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "ownerId";

-- AddForeignKey
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
