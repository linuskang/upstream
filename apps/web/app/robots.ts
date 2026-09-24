import type { MetadataRoute } from "next"
import { env } from "@workspace/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/home", "/blog", "/docs"],
      disallow: [
        "/api/",
        "/project/",
        "/settings/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/test-auth",
        "/test-events",
      ],
    },
    sitemap: `${env.BETTER_AUTH_URL}/sitemap.xml`,
  }
}
