export interface Event {
  id: string

  title: string
  icon?: string

  description?: string
  category?: string

  fields?: {
    title: string
    value: string
  }[]
  actions?: {
    title: string
    variant: "primary" | "secondary" | "ghost"
    url: string
  }[]
  data?: unknown

  events?: Event[]

  contextId?: string

  pushNotify: boolean
  emailNotify: boolean

  projectId?: string
  project?: {
    id: string
    name: string
  }

  createdAt: string
}
