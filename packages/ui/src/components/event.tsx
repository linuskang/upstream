"use client"

import { useState } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  EventActions,
  EventData,
  EventFields,
} from "@workspace/ui/components/event-parts"
import { CompactEventTimeline } from "@workspace/ui/components/event-timeline"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

import type { Event } from "@workspace/contracts"

export type EventProps = Event

export function Event({
  title,
  icon,
  description,
  category,
  fields,
  actions,
  data,
  emailNotify,
  events,
  pushNotify,
  createdAt,
}: Event) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasExtras =
    Boolean(description) ||
    Boolean(actions?.length) ||
    Boolean(data) ||
    Boolean(fields?.length) ||
    Boolean(events?.length)

  const copyJson = () => {
    if (!data) return
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleOpen = () => {
    if (hasExtras) setOpen((prev) => !prev)
  }

  return (
    <Card className="mx-auto w-full gap-0 bg-card p-3 text-left ring-0">
      <CardHeader
        className={cn(
          "group flex flex-row items-center space-y-0 p-0 transition-opacity",
          hasExtras && "cursor-pointer select-none hover:opacity-80"
        )}
        onClick={toggleOpen}
        role={hasExtras ? "button" : undefined}
        aria-expanded={hasExtras ? open : undefined}
      >
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-lg">
          {icon || "~"}
          {(pushNotify || emailNotify) && (
            <div className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              !
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 pl-1">
          <CardTitle className="flex w-full flex-1 items-center text-sm leading-none font-medium">
            <span className="shrink-0 text-base leading-none font-medium text-muted-foreground">
              {new Date(createdAt)
                .toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
                .toLowerCase()}
            </span>

            <span
              className={cn(
                "ml-2 text-base leading-snug text-foreground",
                open ? "break-words whitespace-normal" : "truncate"
              )}
            >
              {title}
            </span>

            {category && (
              <span className="ml-2 hidden shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize sm:inline-block">
                {category}
              </span>
            )}

            {hasExtras && (
              <div className="ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
                {open ? (
                  <ChevronUp className="size-5" />
                ) : (
                  <ChevronDown className="size-5" />
                )}
              </div>
            )}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "grid p-0 pl-[3.25rem] transition-all duration-300 ease-out",
          open
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "mt-0 grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {description && (
            <div className="text-sm leading-relaxed font-medium break-words whitespace-pre-wrap text-muted-foreground">
              {description}
            </div>
          )}

          {fields && fields.length > 0 && (
            <div className="mt-2">
              <EventFields fields={fields} />
            </div>
          )}

          {events && events.length > 0 && (
            <CompactEventTimeline events={events} />
          )}

          {!!data && (
            <div className="mt-4">
              <EventData data={data} onCopy={copyJson} copied={copied} />
            </div>
          )}

          {actions && actions.length > 0 && (
            <div className="mt-4">
              <EventActions actions={actions} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
