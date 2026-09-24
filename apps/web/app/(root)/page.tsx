"use client"

import { authClient } from "@workspace/auth/client"
import { useEffect, useState } from "react"

export default function Page() {
  const { data: session, isPending } = authClient.useSession()
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!isPending && session) {
      setSignedIn(true)
    }
  }, [isPending, session])

  if (isPending) {
    return <h1>loading</h1>
  }

  return (
    <div>
      <h1>landing page {signedIn ? "Signed In" : "Not Signed In"}</h1>
    </div>
  )
}
