const apiResponse = (dataSchema: unknown) => ({
  type: "object",
  properties: {
    code: { type: "integer" },
    success: { type: "boolean" },
    message: { type: "string", nullable: true },
    data: dataSchema,
  },
})

const user = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    image: { type: "string", nullable: true },
  },
}

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Upstream API",
    description: "API documentation for the Upstream event logging platform.",
    version: "1.0.0",
  },
  servers: [
    {
      url: "/api/v1",
      description: "API v1",
    },
  ],
  tags: [
    { name: "Events", description: "Ingest and query events" },
    { name: "Projects", description: "Manage projects" },
    { name: "API Keys", description: "Manage project API keys" },
    { name: "Webhooks", description: "Manage project webhooks" },
    { name: "Account", description: "Account usage and activity" },
    { name: "Cron", description: "Internal cron endpoints" },
  ],
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
        description: "API key for event ingestion. Required for /log only.",
      },
    },
    schemas: {
      Project: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          owner: user,
          apiKeys: {
            type: "array",
            items: { $ref: "#/components/schemas/ApiKey" },
          },
        },
      },
      ApiKey: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          active: { type: "boolean" },
          lastUsed: { type: "string", format: "date-time", nullable: true },
          addedBy: user,
        },
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          icon: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          category: { type: "string", nullable: true },
          fields: {
            type: "array",
            nullable: true,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                value: { type: "string" },
              },
            },
          },
          actions: {
            type: "array",
            nullable: true,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                variant: {
                  type: "string",
                  enum: ["primary", "secondary", "ghost"],
                },
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
          contextId: { type: "string", nullable: true },
          contextStart: { type: "boolean" },
          pushNotify: { type: "boolean" },
          emailNotify: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          projectId: { type: "string" },
          events: {
            type: "array",
            nullable: true,
            items: { $ref: "#/components/schemas/Event" },
          },
        },
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          name: { type: "string" },
          subscription: { type: "string" },
          url: { type: "string" },
          enabled: { type: "boolean" },
          lastTriggered: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RequestLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          endpoint: { type: "string" },
          method: { type: "string" },
          status: { type: "integer" },
          userAgent: { type: "string" },
          requestBody: { type: "string", nullable: true },
          responseBody: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          message: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          user: {
            type: "object",
            nullable: true,
            properties: {
              name: { type: "string" },
              image: { type: "string", nullable: true },
            },
          },
        },
      },
      CategoryList: {
        type: "object",
        properties: {
          total: { type: "integer" },
          categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                count: { type: "integer" },
              },
            },
          },
        },
      },
      Usage: {
        type: "object",
        properties: {
          plan: { type: "string" },
          projects: {
            type: "object",
            properties: {
              current: { type: "integer" },
              limit: { type: "integer" },
            },
          },
          eventsMonth: {
            type: "object",
            properties: {
              current: { type: "integer" },
              limit: { type: "integer" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/log": {
      post: {
        tags: ["Events"],
        summary: "Ingest an event",
        description:
          "Creates a new event for the project associated with the API key.",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", minLength: 1 },
                  icon: { type: "string", minLength: 1, maxLength: 32 },
                  description: { type: "string", nullable: true },
                  category: { type: "string", nullable: true },
                  fields: {
                    type: "array",
                    nullable: true,
                    items: {
                      type: "object",
                      required: ["title", "value"],
                      properties: {
                        title: { type: "string" },
                        value: { type: "string" },
                      },
                    },
                  },
                  actions: {
                    type: "array",
                    nullable: true,
                    items: {
                      type: "object",
                      required: ["title", "url"],
                      properties: {
                        title: { type: "string" },
                        variant: {
                          type: "string",
                          enum: ["primary", "secondary", "ghost"],
                          default: "primary",
                        },
                        url: { type: "string", format: "uri" },
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
                  contextId: { type: "string", nullable: true },
                  contextStart: { type: "boolean", default: false },
                  pushNotify: { type: "boolean", default: false },
                  emailNotify: { type: "boolean", default: false },
                },
              },
            },
          },
        },
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
        },
      },
    },
    "/project": {
      get: {
        tags: ["Projects"],
        summary: "List projects",
        description:
          "Returns a list of projects owned by the authenticated user.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of projects",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                }),
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Projects"],
        summary: "Create a project",
        description:
          "Creates a new project. Respects the project quota for the current plan.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Project created",
            content: {
              "application/json": {
                schema: apiResponse({ $ref: "#/components/schemas/Project" }),
              },
            },
          },
          "403": { description: "Project limit reached" },
        },
      },
    },
    "/project/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Projects"],
        summary: "Get project",
        description:
          "Returns a project by ID, including API keys and owner details.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Project details",
            content: {
              "application/json": {
                schema: apiResponse({ $ref: "#/components/schemas/Project" }),
              },
            },
          },
          "404": { description: "Project not found" },
        },
      },
      patch: {
        tags: ["Projects"],
        summary: "Rename project",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Project renamed",
            content: {
              "application/json": {
                schema: apiResponse({ $ref: "#/components/schemas/Project" }),
              },
            },
          },
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Project deleted",
            content: {
              "application/json": {
                schema: apiResponse({ type: "object" }),
              },
            },
          },
        },
      },
    },
    "/project/{id}/events": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Events"],
        summary: "List events",
        description:
          "Returns a paginated list of top-level events for a project. Supports field filters and general search.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string" },
            description: "Filter by category. Use 'none' for null.",
          },
          {
            name: "id",
            in: "query",
            schema: { type: "string" },
            description: "Filter by event ID.",
          },
          {
            name: "title",
            in: "query",
            schema: { type: "string" },
            description: "Filter by title (contains, case-insensitive).",
          },
          {
            name: "description",
            in: "query",
            schema: { type: "string" },
            description: "Filter by description (contains, case-insensitive).",
          },
          {
            name: "pushNotify",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter by pushNotify flag.",
          },
          {
            name: "contextId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by context ID. Use 'none' for null.",
          },
          {
            name: "createdAt",
            in: "query",
            schema: { type: "string" },
            description:
              "Filter by date. Use YYYY-MM-DD for a full day or ISO timestamp for exact match.",
          },
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description:
              "General search across title, description and category.",
          },
        ],
        responses: {
          "200": {
            description: "Paginated events",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "object",
                  properties: {
                    events: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Event" },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        pages: { type: "integer" },
                      },
                    },
                  },
                }),
              },
            },
          },
        },
      },
    },
    "/project/{id}/categories": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Events"],
        summary: "List categories",
        description:
          "Returns the total event count and category breakdown for a project.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Category list",
            content: {
              "application/json": {
                schema: apiResponse({
                  $ref: "#/components/schemas/CategoryList",
                }),
              },
            },
          },
        },
      },
    },
    "/project/{id}/keys": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["API Keys"],
        summary: "List API keys",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of API keys",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/ApiKey" },
                }),
              },
            },
          },
        },
      },
      post: {
        tags: ["API Keys"],
        summary: "Create API key",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "API key created. The response data contains the plaintext key.",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "object",
                  properties: {
                    key: { $ref: "#/components/schemas/ApiKey" },
                    plaintext: { type: "string" },
                  },
                }),
              },
            },
          },
        },
      },
      delete: {
        tags: ["API Keys"],
        summary: "Delete API key",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["keyId"],
                properties: {
                  keyId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "API key deleted",
            content: {
              "application/json": {
                schema: apiResponse({ type: "object" }),
              },
            },
          },
        },
      },
    },
    "/project/{id}/logs": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Projects"],
        summary: "List audit logs",
        description: "Returns recent audit logs for a project.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Audit logs",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/AuditLog" },
                }),
              },
            },
          },
        },
      },
    },
    "/project/{id}/requests": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Projects"],
        summary: "List request logs",
        description: "Returns request logs for a project.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Request logs",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/RequestLog" },
                }),
              },
            },
          },
        },
      },
    },
    "/project/{id}/webhooks": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Webhooks"],
        summary: "List webhooks",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of webhooks",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/Webhook" },
                }),
              },
            },
          },
        },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Create webhook",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "subscription", "url"],
                properties: {
                  name: { type: "string" },
                  subscription: { type: "string" },
                  url: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook created",
            content: {
              "application/json": {
                schema: apiResponse({ $ref: "#/components/schemas/Webhook" }),
              },
            },
          },
        },
      },
      patch: {
        tags: ["Webhooks"],
        summary: "Update webhook",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["webhookId"],
                properties: {
                  webhookId: { type: "string" },
                  name: { type: "string" },
                  subscription: { type: "string" },
                  url: { type: "string", format: "uri" },
                  enabled: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook updated",
            content: {
              "application/json": {
                schema: apiResponse({ $ref: "#/components/schemas/Webhook" }),
              },
            },
          },
        },
      },
      delete: {
        tags: ["Webhooks"],
        summary: "Delete webhook",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["webhookId"],
                properties: {
                  webhookId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook deleted",
            content: {
              "application/json": {
                schema: apiResponse({ type: "object" }),
              },
            },
          },
        },
      },
    },
    "/account/usage": {
      get: {
        tags: ["Account"],
        summary: "Account usage",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Usage statistics",
            content: {
              "application/json": {
                schema: apiResponse({ $ref: "#/components/schemas/Usage" }),
              },
            },
          },
        },
      },
    },
    "/account/activity": {
      get: {
        tags: ["Account"],
        summary: "Account activity",
        description:
          "Returns recent activity across all projects owned by the user.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Recent activity",
            content: {
              "application/json": {
                schema: apiResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/AuditLog" },
                }),
              },
            },
          },
        },
      },
    },
    "/cron/retention": {
      post: {
        tags: ["Cron"],
        summary: "Run retention cleanup",
        description:
          "Internal cron endpoint. Requires `x-api-key` header matching the `CRON_SECRET` environment variable.",
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
        },
      },
    },
  },
}
