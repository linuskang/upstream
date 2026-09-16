import { NextResponse } from "next/server"
import { getVapidPublicKey } from "@/server/vapid"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(
    { publicKey: getVapidPublicKey() },
    { headers: { "Cache-Control": "no-store" } }
  )
}