/*
  Warnings:

  - Made the column `image` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "image" SET NOT NULL;

-- RenameForeignKey
ALTER TABLE "Account" RENAME CONSTRAINT "account_userId_fkey" TO "Account_userId_fkey";

-- RenameForeignKey
ALTER TABLE "ProjectInvitation" RENAME CONSTRAINT "project_invitation_invitedById_fkey" TO "ProjectInvitation_invitedById_fkey";

-- RenameForeignKey
ALTER TABLE "ProjectInvitation" RENAME CONSTRAINT "project_invitation_projectId_fkey" TO "ProjectInvitation_projectId_fkey";

-- RenameForeignKey
ALTER TABLE "ProjectMember" RENAME CONSTRAINT "project_member_projectId_fkey" TO "ProjectMember_projectId_fkey";

-- RenameForeignKey
ALTER TABLE "ProjectMember" RENAME CONSTRAINT "project_member_userId_fkey" TO "ProjectMember_userId_fkey";

-- RenameForeignKey
ALTER TABLE "PushSubscription" RENAME CONSTRAINT "push_subscription_userId_fkey" TO "PushSubscription_userId_fkey";

-- RenameForeignKey
ALTER TABLE "Session" RENAME CONSTRAINT "session_userId_fkey" TO "Session_userId_fkey";
