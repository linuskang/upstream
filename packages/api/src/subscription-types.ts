export const plans = {
  FREE: {
    displayName: "Free",
    maxProjects: 1,
    maxEventsPerMonth: 100,
    retentionDays: 7,
    maxMembersPerProject: 3,
  },
  PRO: {
    displayName: "Pro",
    maxProjects: 100,
    maxEventsPerMonth: 100000,
    retentionDays: 90,
    maxMembersPerProject: 100,
  },
} as const

export type PlanKey = keyof typeof plans

export function getPlan(key: PlanKey | null | undefined) {
  return plans[key ?? "FREE"]
}
