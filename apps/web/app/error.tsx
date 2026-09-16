"use client"

import { useEffect, useMemo } from "react"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const errorId = useMemo(
    () => error.digest ?? crypto.randomUUID().slice(0, 8).toUpperCase(),
    [error]
  )

  useEffect(() => {
    console.error(`Error ID: ${errorId}`, error)
  }, [error, errorId])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-white">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-5xl font-bold text-white select-none">Oops</p>
        <h1 className="-mt-2 text-2xl font-semibold">Something went wrong</h1>
        <p className="text-eventcontent/65 text-sm">
          An unexpected error occurred. If this keeps happening, please contact
          support.
        </p>

        <p className="text-eventcontent/40 font-mono text-xs">
          Error ID: {errorId}
        </p>

        {process.env.NODE_ENV === "development" && (
          <p className="font-mono text-xs break-all text-red-400">
            {error.message}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="secondary">
            <Link href="/">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
