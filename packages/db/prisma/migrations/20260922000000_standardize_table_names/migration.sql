-- Standardise table names to PascalCase (matching Prisma model names)

-- Rename tables
ALTER TABLE "user" RENAME TO "User";
ALTER TABLE "project_member" RENAME TO "ProjectMember";
ALTER TABLE "project_invitation" RENAME TO "ProjectInvitation";
ALTER TABLE "session" RENAME TO "Session";
ALTER TABLE "account" RENAME TO "Account";
ALTER TABLE "verification" RENAME TO "Verification";
ALTER TABLE "push_subscription" RENAME TO "PushSubscription";

-- Rename constraints and indexes to follow Prisma's PascalCase-derived names
ALTER TABLE "User" RENAME CONSTRAINT "user_pkey" TO "User_pkey";
ALTER INDEX "user_email_key" RENAME TO "User_email_key";

ALTER TABLE "ProjectMember" RENAME CONSTRAINT "project_member_pkey" TO "ProjectMember_pkey";
ALTER INDEX "project_member_projectId_userId_key" RENAME TO "ProjectMember_projectId_userId_key";
ALTER INDEX "project_member_userId_idx" RENAME TO "ProjectMember_userId_idx";
ALTER INDEX "project_member_projectId_idx" RENAME TO "ProjectMember_projectId_idx";

ALTER TABLE "ProjectInvitation" RENAME CONSTRAINT "project_invitation_pkey" TO "ProjectInvitation_pkey";
ALTER INDEX "project_invitation_token_key" RENAME TO "ProjectInvitation_token_key";
ALTER INDEX "project_invitation_projectId_idx" RENAME TO "ProjectInvitation_projectId_idx";
ALTER INDEX "project_invitation_token_idx" RENAME TO "ProjectInvitation_token_idx";

ALTER TABLE "Session" RENAME CONSTRAINT "session_pkey" TO "Session_pkey";
ALTER INDEX "session_token_key" RENAME TO "Session_token_key";
ALTER INDEX "session_userId_idx" RENAME TO "Session_userId_idx";

ALTER TABLE "Account" RENAME CONSTRAINT "account_pkey" TO "Account_pkey";
ALTER INDEX "account_userId_idx" RENAME TO "Account_userId_idx";

ALTER TABLE "Verification" RENAME CONSTRAINT "verification_pkey" TO "Verification_pkey";
ALTER INDEX "verification_identifier_idx" RENAME TO "Verification_identifier_idx";

ALTER TABLE "PushSubscription" RENAME CONSTRAINT "push_subscription_pkey" TO "PushSubscription_pkey";
ALTER INDEX "push_subscription_endpoint_key" RENAME TO "PushSubscription_endpoint_key";
ALTER INDEX "push_subscription_userId_idx" RENAME TO "PushSubscription_userId_idx";