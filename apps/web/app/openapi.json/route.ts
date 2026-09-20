import { NextResponse } from "next/server"
import { buildOpenApiSpec } from "@/lib/openapi"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(buildOpenApiSpec())
}
