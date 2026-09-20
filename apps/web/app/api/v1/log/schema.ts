import { z } from "zod"

export const Payload = z.object({
  title: z.string().min(1),
  icon: z.string().min(1).max(32).optional(),

  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),

  fields: z
    .array(
      z.object({
        title: z.string(),
        value: z.string(),
      })
    )
    .optional()
    .nullable(),
  actions: z
    .array(
      z.object({
        title: z.string(),
        variant: z.enum(["primary", "secondary", "ghost"]).default("primary"),
        url: z.url(),
      })
    )
    .optional()
    .nullable(),
  data: z.json().optional().nullable(),

  contextId: z.string().optional().nullable(),
  contextStart: z.boolean().default(false),

  pushNotify: z.boolean().default(false),
  emailNotify: z.boolean().default(false),
})

export type Payload = z.infer<typeof Payload>
