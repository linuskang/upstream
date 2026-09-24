"use client"

import { authClient } from "@workspace/auth/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Page() {
  const { data: session, isPending } = authClient.useSession()

  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/sign-in")
    }
  }, [isPending, session, router])

  if (isPending || !session) {
    return <h1>loading...</h1>
  }

  return <h1>hello {session.user.name}</h1>
}
