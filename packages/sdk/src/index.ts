import axios from "axios"

export interface Configuration {
  apiKey: string
  host?: string
}

export interface EventContext {
  title: string
  icon?: string
  description?: string | null
  category?: string | null
  fields?: { title: string; value: string }[]
  actions?: {
    title: string
    variant: "primary" | "secondary" | "ghost"
    url: string
  }[]
  data?: unknown
  contextId?: string | null
  contextStart?: boolean
  pushNotify?: boolean
  emailNotify?: boolean
}

export interface IngestedEvent {
  id: string
  projectId: string
  title: string
  icon?: string
  description?: string | null
  category?: string | null
  fields?: { title: string; value: string }[] | null
  actions?: { title: string; variant: string; url: string }[] | null
  data?: unknown
  contextId?: string | null
  contextStart: boolean
  pushNotify: boolean
  emailNotify: boolean
  createdAt: string
}

interface ApiResponse<T> {
  code: number
  success: boolean
  message: string | null
  data: T
}

export class UpstreamError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "UpstreamError"
  }
}

class EventsSDK {
  constructor(private readonly config: Configuration) {}

  async ingest(event: EventContext): Promise<IngestedEvent> {
    const upsHost = `${this.config.host ?? "https://up.linus.my"}`
    const payloadUrl = `${upsHost}/api/v1/log`

    try {
      const res = await axios.post(payloadUrl, event, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "User-Agent": "@uplabs-sdk/0.3.2",
        },
      })

      const body = res.data as ApiResponse<IngestedEvent>
      return body.data
    } catch (err) {
      if (axios.isAxiosError<ApiResponse<unknown>>(err)) {
        const status = err.response?.status ?? 0
        const message = err.response?.data?.message ?? err.message
        throw new UpstreamError(status, message)
      }
      throw err
    }
  }
}

export class Upstream {
  readonly events: EventsSDK

  constructor(readonly config: Configuration) {
    this.events = new EventsSDK(config)
  }
}
