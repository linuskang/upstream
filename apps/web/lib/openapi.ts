import { z } from "zod"
import { appRouter } from "@workspace/api/root"
import { Payload as IngestEventPayload } from "../app/api/v1/log/schema"

/**
 * OpenAPI specification generator.
 *
 * The tRPC procedures are discovered at runtime from `appRouter`, and their
 * input schemas are converted straight from the Zod definitions. The only
 * hand-written parts are the handful of legacy REST routes under `/api/v1`
 * that have not moved to tRPC yet.
 *
 * Run `npm run generate-api-spec` to write the spec to disk.
 */

type JsonSchema = Record<string, unknown>

type ProcedureType = "query" | "mutation" | "subscription"

interface ProcedureDefinition {
  _def: {
    type: ProcedureType
    inputs: unknown[]
    meta?: {
      openapi?: {
        method?: string
        path?: string
        tags?: string[]
        summary?: string
        description?: string
        protect?: boolean
      }
    }
  }
}

interface RouterDefinition {
  procedures: Record<string, ProcedureDefinition>
}

const routerTags: Record<string, { name: string; description: string }> = {
  account: { name: "Account", description: "Account usage and activity" },
  project: { name: "Projects", description: "Manage projects" },
  usage: { name: "Usage", description: "Plan usage and quotas" },
  event: { name: "Events", description: "Query and ingest events" },
  apiKey: { name: "API Keys", description: "Manage project API keys" },
  webhook: { name: "Webhooks", description: "Manage project webhooks" },
  projectSettings: {
    name: "Project Settings",
    description: "Project audit and request logs",
  },
  projectMember: {
    name: "Project Members",
    description: "Manage project members and invitations",
  },
}

const legacyTags = [
  { name: "Events", description: "Query and ingest events" },
  { name: "Cron", description: "Internal cron endpoints" },
]

const apiResponse = (dataSchema: unknown): JsonSchema => ({
  type: "object",
  properties: {
    code: { type: "integer" },
    success: { type: "boolean" },
    message: { type: ["string", "null"] },
    data: dataSchema,
  },
})

const eventSchema: JsonSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    icon: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    fields: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          value: { type: "string" },
        },
      },
    },
    actions: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          variant: { type: "string", enum: ["primary", "secondary", "ghost"] },
          url: { type: "string" },
        },
      },
    },
    data: {
      oneOf: [
        { type: "object" },
        { type: "array" },
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
    },
    contextId: { type: ["string", "null"] },
    contextStart: { type: "boolean" },
    pushNotify: { type: "boolean" },
    emailNotify: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    projectId: { type: "string" },
    events: {
      type: ["array", "null"],
      items: { $ref: "#/components/schemas/Event" },
    },
  },
}

const trpcErrorSchema: JsonSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        message: { type: "string" },
        code: { type: "integer" },
        data: {
          type: "object",
          properties: {
            code: { type: "string" },
            httpStatus: { type: "integer" },
            path: { type: "string" },
          },
        },
      },
      required: ["message", "code"],
    },
  },
  required: ["error"],
}

const trpcSuccessResponse = (procedurePath: string) => ({
  description: "Successful response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          result: {
            type: "object",
            properties: {
              data: {},
            },
            required: ["data"],
            description: `The result returned by \`${procedurePath}\`.`,
          },
        },
        required: ["result"],
      },
    },
  },
})

const trpcResponses = (procedurePath: string) => ({
  "200": trpcSuccessResponse(procedurePath),
  "400": {
    description: "Bad request",
    content: { "application/json": { schema: trpcErrorSchema } },
  },
  "401": { description: "Unauthorized" },
  "403": { description: "Forbidden" },
  "404": { description: "Not found" },
  "500": { description: "Internal server error" },
})

/**
 * Converts a Zod input schema into JSON Schema, hoisting any local `$defs`
 * (used by recursive schemas such as `z.json()`) into the document's
 * `components.schemas` so that `$ref`s stay resolvable once embedded.
 */
function schemaToJson(
  schema: unknown,
  prefix: string,
  defs: Record<string, JsonSchema>
): JsonSchema | undefined {
  if (!(schema instanceof z.ZodType)) return undefined

  let raw: JsonSchema
  try {
    raw = z.toJSONSchema(schema, {
      io: "input",
      unrepresentable: "any",
    }) as JsonSchema
  } catch {
    return undefined
  }

  const localDefs = raw.$defs
  delete raw.$defs

  const rewrite = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rewrite)

    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {}

      for (const [key, child] of Object.entries(value)) {
        if (key === "$schema") continue

        if (
          key === "$ref" &&
          typeof child === "string" &&
          child.startsWith("#/$defs/")
        ) {
          result[key] =
            `#/components/schemas/${prefix}${child.slice("#/$defs/".length)}`
          continue
        }

        result[key] = rewrite(child)
      }

      return result
    }

    return value
  }

  if (localDefs && typeof localDefs === "object") {
    for (const [name, definition] of Object.entries(localDefs)) {
      defs[`${prefix}${name}`] = rewrite(definition) as JsonSchema
    }
  }

  return rewrite(raw) as JsonSchema
}

function hasRequiredProperties(schema: JsonSchema | undefined): boolean {
  const required = schema?.required
  return Array.isArray(required) && required.length > 0
}

function humanize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function getProcedures(): Record<string, ProcedureDefinition> {
  return (appRouter as unknown as { _def: RouterDefinition })._def.procedures
}

function buildTrpcPaths(defs: Record<string, JsonSchema>) {
  const paths: Record<string, Record<string, unknown>> = {}
  const usedTags = new Set<string>()

  for (const [procedurePath, procedure] of Object.entries(getProcedures())) {
    const [routerName = procedurePath, action = procedurePath] =
      procedurePath.split(".")
    const tag = routerTags[routerName] ?? {
      name: humanize(routerName),
      description: `tRPC router \`${routerName}\``,
    }
    usedTags.add(tag.name)

    const { type, inputs, meta } = procedure._def
    const override = meta?.openapi
    const isQuery = type !== "mutation"
    const method = override?.method ?? (isQuery ? "get" : "post")
    const path = override?.path ?? `/api/trpc/${procedurePath}`

    const inputSchema = schemaToJson(
      inputs[inputs.length - 1],
      `${routerName}_${action}_`,
      defs
    )

    const operation: Record<string, unknown> = {
      tags: override?.tags ?? [tag.name],
      summary: override?.summary ?? `${tag.name} - ${humanize(action)}`,
      description:
        override?.description ??
        `Calls the \`${procedurePath}\` tRPC ${type} via \`${method.toUpperCase()} ${path}\`.`,
      operationId: `${routerName}_${action}`,
      security: override?.protect === false ? [] : [{ cookieAuth: [] }],
      responses: trpcResponses(procedurePath),
    }

    if (inputSchema) {
      if (isQuery) {
        operation.parameters = [
          {
            name: "input",
            in: "query",
            required: hasRequiredProperties(inputSchema),
            description: "JSON-encoded tRPC input.",
            schema: { type: "string" },
            content: { "application/json": { schema: inputSchema } },
          },
        ]
      } else {
        operation.requestBody = {
          required: true,
          content: { "application/json": { schema: inputSchema } },
        }
      }
    }

    paths[path] = { ...(paths[path] ?? {}), [method]: operation }
  }

  return { paths, usedTags }
}

function buildLegacyPaths(defs: Record<string, JsonSchema>) {
  const ingestSchema = schemaToJson(
    IngestEventPayload,
    "IngestEventPayload_",
    defs
  )

  return {
    "/api/v1/log": {
      post: {
        tags: ["Events"],
        summary: "Ingest an event",
        description:
          "Creates a new event for the project associated with the API key.",
        operationId: "ingestEvent",
        security: [{ apiKey: [] }],
        requestBody: ingestSchema
          ? {
              required: true,
              content: { "application/json": { schema: ingestSchema } },
            }
          : undefined,
        responses: {
          "200": {
            description: "Event created",
            content: {
              "application/json": {
                schema: apiResponse({ $ref: "#/components/schemas/Event" }),
              },
            },
          },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "429": { description: "Monthly event quota exceeded" },
        },
      },
    },
    "/api/v1/cron/retention": {
      post: {
        tags: ["Cron"],
        summary: "Run retention cleanup",
        description:
          "Internal cron endpoint. Requires an `x-api-key` header matching the `CRON_SECRET` environment variable.",
        operationId: "runRetentionCleanup",
        security: [{ apiKey: [] }],
        responses: {
          "200": {
            description: "Cleanup completed",
            content: {
              "application/json": {
                schema: apiResponse({ type: "object" }),
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
  }
}

export function buildOpenApiSpec() {
  const defs: Record<string, JsonSchema> = {}
  const { paths: trpcPaths, usedTags } = buildTrpcPaths(defs)
  const legacyPaths = buildLegacyPaths(defs)

  const paths = Object.fromEntries(
    Object.entries({ ...trpcPaths, ...legacyPaths }).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  )

  const tags = [...Object.values(routerTags), ...legacyTags]
    .filter((tag) => usedTags.has(tag.name) || legacyTags.includes(tag))
    .filter(
      (tag, index, all) =>
        all.findIndex((item) => item.name === tag.name) === index
    )

  return {
    openapi: "0.1.0",
    info: {
      title: "Upstream API Reference",
      version: "0.0.11",
    },
    servers: [
      {
        url: "/",
        description: "Application root",
      },
    ],
    tags,
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description: "Session cookie for browser-based authentication.",
        },
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description:
            "API key for event ingestion and internal cron endpoints.",
        },
      },
      schemas: {
        Event: eventSchema,
        ...defs,
      },
    },
    paths,
  }
}

export type OpenApiSpec = ReturnType<typeof buildOpenApiSpec>
