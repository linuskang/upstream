"use client"

import { Fragment } from "react"

import { cn } from "cn"
import {
  EventActions,
  EventData,
  EventFields,
} from "@workspace/ui/components/event-parts"
import {
  formatDuration,
  formatTime,
} from "@workspace/ui/components/event-utils"

import type { Event } from "@workspace/contracts"

export function CompactEventItem({ event }: { event: Event }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs leading-none text-muted-foreground">
          {formatTime(event.createdAt)}
        </span>
        <span className="text-sm leading-none font-medium text-foreground">
          {event.title}
        </span>
      </div>

      {event.description && (
        <p className="text-xs text-muted-foreground">{event.description}</p>
      )}

      {event.fields && event.fields.length > 0 && (
        <div className="mt-3">
          <EventFields fields={event.fields} compact />
        </div>
      )}

      {!!event.data && (
        <div className="mt-1">
          <EventData data={event.data} compact />
        </div>
      )}

      {event.actions && event.actions.length > 0 && (
        <div className="mt-1">
          <EventActions actions={event.actions} compact />
        </div>
      )}

      {event.events && event.events.length > 0 && (
        <CompactEventTimeline events={event.events} />
      )}
    </div>
  )
}

export function CompactEventTimeline({ events }: { events: Event[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const first = new Date(sorted[0]!.createdAt)
  const last = new Date(sorted[sorted.length - 1]!.createdAt)
  const duration = last.getTime() - first.getTime()

  return (
    <div className="mt-3 grid grid-cols-[1.5rem_1fr] gap-x-3">
      {sorted.map((event, index) => {
        const isFirst = index === 0
        const isLast = index === sorted.length - 1

        return (
          <Fragment key={event.id ?? index}>
            <div className="relative">
              <div
                className={cn(
                  "absolute left-1/2 w-px -translate-x-1/2 border-l-2 border-dashed border-foreground/10",
                  isFirst ? "top-3.5 bottom-0" : "top-0 bottom-0",
                  isLast ? "bottom-3.5" : ""
                )}
              />
              <div className="relative flex size-7 items-center justify-center rounded-full bg-background text-sm leading-none">
                <span className="leading-none">{event.icon || "~"}</span>
                {event.pushNotify && (
                  <div className="absolute top-0 right-0 flex size-3.5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-red-500 text-[8px] leading-none font-bold text-white">
                    !
                  </div>
                )}
              </div>
            </div>

            <div className="pt-1.5 pb-3 pl-1">
              <CompactEventItem event={event} />
            </div>
          </Fragment>
        )
      })}

      <p className="col-span-2 pb-2 text-sm font-medium text-muted-foreground">
        {sorted.length} event{sorted.length === 1 ? "" : "s"}.{" "}
        {formatDuration(duration)}.
      </p>
    </div>
  )
}
