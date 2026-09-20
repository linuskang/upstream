"use client"

import { Input } from "@workspace/ui/components/input"
import { cn } from "cn"
import { Search, X } from "lucide-react"

export function EventSearch({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 z-20 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={3}
      />
      <Input
        type="search"
        className="relative z-10 h-9 w-full rounded-xl border-0 !bg-card pr-8 pl-9 font-medium focus:!ring-0 [&::-webkit-search-cancel-button]:appearance-none"
        placeholder="Search events..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("")
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
