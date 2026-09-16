"use client"

import { useState, useMemo } from "react"

import { Event } from "@workspace/ui/components/event"
import { EventSearch } from "@workspace/ui/components/event-search"
import {
  CategorySelector,
  CategoryProps,
} from "@workspace/ui/components/event-category"

import type { Event as EventType } from "@workspace/contracts"

export default function Page() {
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    "all"
  )

  const events: EventType[] = useMemo(() => {
    const now = new Date()
    return [
      {
        id: "test-event",
        title: "daily billing sync started",
        createdAt: now.toISOString(),
        pushNotify: true,
        emailNotify: false,
        icon: "📄",
        description: "Automated billing sync initiated for the workspace.",
        category: "billing",
        fields: [
          { title: "Workspace", value: "Acme Corp" },
          { title: "Invoices", value: "198" },
          { title: "Currency", value: "USD" },
          { title: "Run ID", value: "run_7f8a9b2c" },
        ],
        actions: [
          { title: "View Run", variant: "primary", url: "#" },
          { title: "Logs", variant: "secondary", url: "#" },
        ],
        data: {
          source: "scheduler",
          environment: "production",
          retries: 0,
        },
        events: [
          {
            id: "test-event-1",
            title: "processed invoices",
            createdAt: new Date(now.getTime() + 1200).toISOString(),
            pushNotify: false,
            emailNotify: false,
            icon: "📄",
            description: "Batch processed all pending invoices.",
            category: "billing",
            fields: [
              { title: "Processed", value: "198" },
              { title: "Skipped", value: "4" },
            ],
            actions: [],
            data: { batchId: "batch_001" },
            events: [],
          },
          {
            id: "test-event-2",
            title: "daily billing sync finished",
            createdAt: new Date(now.getTime() + 3400).toISOString(),
            pushNotify: true,
            emailNotify: false,
            icon: "✅",
            description: "Sync completed with a few failures.",
            category: "billing",
            fields: [
              { title: "Succeeded", value: "194" },
              { title: "Failed", value: "4" },
            ],
            actions: [{ title: "Retry", variant: "primary", url: "#" }],
            data: {
              summary: {
                succeeded: 194,
                failed: 4,
                skipped: 0,
              },
            },
          },
        ],
      },
      {
        id: "second-event",
        title: "user signed up",
        createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        pushNotify: false,
        emailNotify: false,
        icon: "🚀",
        description: "A new user completed the onboarding flow.",
        category: "auth",
        fields: [
          { title: "Email", value: "user@example.com" },
          { title: "Plan", value: "Pro" },
        ],
        actions: [{ title: "View Profile", variant: "secondary", url: "#" }],
        data: { userId: "usr_123", referrer: "twitter" },
      },
    ]
  }, [])

  const categories: CategoryProps[] = useMemo(() => {
    const counts = new Map<string, number>()
    counts.set("all", events.length)
    counts.set("none", 0)
    for (const event of events) {
      const key = event.category ?? "none"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .filter(([name, count]) => name !== "none" || count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (a.name === "all") return -1
        if (b.name === "all") return 1
        if (a.name === "none") return -1
        if (b.name === "none") return 1
        return a.name.localeCompare(b.name)
      })
  }, [events])

  const filteredEvents = useMemo(() => {
    let result = events

    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter((event) =>
        selectedCategory === "none"
          ? !event.category
          : event.category === selectedCategory
      )
    }

    const q = query.trim().toLowerCase()
    if (!q) return result

    return result.filter((event) => {
      const match = (str?: string | null) =>
        str?.toLowerCase().includes(q) ?? false

      if (match(event.title)) return true
      if (match(event.description)) return true
      if (match(event.category)) return true
      if (event.fields?.some((f) => match(f.title) || match(f.value)))
        return true
      if (event.actions?.some((a) => match(a.title))) return true
      if (match(JSON.stringify(event.data))) return true
      return false
    })
  }, [events, query, selectedCategory])

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="-mb-3 text-3xl font-semibold">Events</h1>
      <div className="flex flex-col gap-2 py-6 sm:flex-row sm:items-start">
        <div className="shrink-0">
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2">
          <EventSearch value={query} onChange={setQuery} />

          {filteredEvents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No events match &quot;{query}&quot;.
            </p>
          ) : (
            filteredEvents.map((event) => <Event key={event.id} {...event} />)
          )}
        </div>
      </div>
    </div>
  )
}
