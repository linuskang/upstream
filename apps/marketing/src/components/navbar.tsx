import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { GeistMono } from "geist/font/mono"
import Image from "next/image"
import Link from "next/link"

import { Github } from "@/components/icons"

async function getGithubStars() {
  try {
    const response = await fetch("https://api.github.com/repos/linuskang/up", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return null

    const repository = (await response.json()) as {
      stargazers_count: number
    }
    return repository.stargazers_count
  } catch {
    return null
  }
}

export async function Navbar() {
  const stars = await getGithubStars()

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-transparent bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/">
            <Image
              src="/logo.png"
              width={40}
              height={40}
              alt="Logo"
              className="sm:size-12"
            />
          </Link>

          <span
            className={`${GeistMono.className} rounded-sm bg-card px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:py-1 sm:text-xs`}
          >
            beta
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground sm:px-2 sm:text-xs"
          >
            <Link href="/docs">Docs</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="px-1.5 text-[11px] font-medium sm:px-2 sm:text-xs"
            >
              <Link href="https://up.linus.my" target="_blank">
                Log in
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-4 self-center!" />
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 text-[11px] font-medium text-muted-foreground hover:bg-transparent hover:text-white sm:px-2 sm:text-xs dark:hover:bg-transparent"
            >
              <Link target="_blank" href="https://github.com/linuskang/up">
                <Github />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
