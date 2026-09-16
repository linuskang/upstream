"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Check, Copy } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

const jsonHighlighterStyle = {
  margin: 0,
  padding: "0.75rem",
  background: "transparent",
} as const

export function EventFields({
  fields,
  compact = false,
}: {
  fields: { title: string; value: string }[]
  compact?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {fields.map((field, index) => {
        const isEmpty = !field.value || field.value.trim() === ""
        return (
          <div key={index} className="flex min-w-0 flex-col">
            <span
              className={cn(
                "font-semibold",
                compact ? "text-[11px]" : "text-sm"
              )}
            >
              {field.title}
            </span>
            <span
              className={cn(
                "min-w-0 font-medium break-words",
                compact ? "text-[11px]" : "text-sm",
                isEmpty
                  ? "text-muted-foreground/60 italic"
                  : "text-muted-foreground"
              )}
            >
              {isEmpty ? "Empty Content" : field.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function EventData({
  data,
  compact = false,
  onCopy,
  copied = false,
}: {
  data: unknown
  compact?: boolean
  onCopy?: () => void
  copied?: boolean
}) {
  return (
    <div className="group relative">
      {onCopy && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-20 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onCopy}
          title="Copy JSON"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-3" />}
        </Button>
      )}

      <div
        className={cn(
          "overflow-auto rounded bg-muted/60",
          compact ? "max-h-32 text-[10px]" : "max-h-80 text-xs"
        )}
      >
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{
            ...jsonHighlighterStyle,
            padding: compact ? "0.5rem" : jsonHighlighterStyle.padding,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export function EventActions({
  actions,
  compact = false,
}: {
  actions: {
    title: string
    variant: "primary" | "secondary" | "ghost"
    url: string
  }[]
  compact?: boolean
}) {
  return (
    <div className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2")}>
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant === "primary" ? "default" : action.variant}
          size="sm"
          className={cn(compact && "h-6 text-xs")}
          onClick={() => window.open(action.url, "_blank")}
        >
          {action.title}
        </Button>
      ))}
    </div>
  )
}
