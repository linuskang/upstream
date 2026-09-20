"use client"

import { authClient } from "@/client/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Page() {
  const router = useRouter()
  useEffect(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/sign-in")
        }
      }
    })
  }, [router])

  return (
    <h1>You will be redirected shortly...</h1>
  )
}