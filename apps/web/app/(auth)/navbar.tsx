import { Separator } from "@workspace/ui/components/separator"
import { BookOpen, Scale } from "lucide-react"
import { Github } from "@/components/icons"
import Link from "next/link"

export function Links() {
  return (
    <nav
      aria-label="Footer"
      className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 text-xs whitespace-nowrap text-muted-foreground"
    >
      <Link
        href="https://ups.linuskang.au/docs"
        className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-foreground"
      >
        <BookOpen className="size-4" />
        Documentation
      </Link>
      <Separator
        orientation="vertical"
        className="h-4 self-center! border-l-2"
      />
      <Link
        href="https://ups.linuskang.au/terms"
        className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-foreground"
      >
        <Scale className="size-4" />
        Terms of Service
      </Link>
      <Separator
        orientation="vertical"
        className="h-4 self-center! border-l-2"
      />
      <Link
        href="https://github.com/linuskang/up"
        target="_blank"
        className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-foreground"
      >
        <Github />
        Open Source
      </Link>
      <Separator
        orientation="vertical"
        className="h-4 self-center! border-l-2"
      />
      <Link
        href="https://github.com/linuskang/up/releases/tag/v0.2.4"
        className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-foreground"
      >
        Upstream v0.2.4
      </Link>
    </nav>
  )
}
