"use client"

import { notFound } from "next/navigation"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import Link from "next/link"

import type { EventProps } from "@workspace/ui/components/event"
import { EventsList } from "@workspace/ui/components/event-list"
import { CategorySelector } from "@workspace/ui/components/event-category"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Folder, Search, Loader2, SlidersHorizontal } from "lucide-react"

const EVENTS_PER_PAGE = 20

interface EventItem extends EventProps {
  id: string
}

type SearchFilters = {
  id?: string
  title?: string
  description?: string
  pushNotify?: string
  category?: string
  contextId?: string
  createdAt?: string
  q?: string
}

function parseSearchQuery(query: string): { filters: SearchFilters } {
  const filters: SearchFilters = {}
  let remaining = query

  const regex = /@(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g
  const matches = [...query.matchAll(regex)]

  for (const match of matches) {
    const field = match[1]
    const value = match[2] || match[3] || match[4]

    if (
      field === "category" ||
      field === "id" ||
      field === "title" ||
      field === "description" ||
      field === "pushNotify" ||
      field === "contextId" ||
      field === "createdAt"
    ) {
      filters[field] = value
    }

    remaining = remaining.replace(match[0], " ")
  }

  const q = remaining.replace(/\s+/g, " ").trim()
  if (q) {
    filters.q = q
  }

  return { filters }
}

function buildQueryString(
  category: string,
  searchQuery: string,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("limit", String(limit))

  if (category !== "all") {
    params.set("category", category)
  }

  const { filters } = parseSearchQuery(searchQuery)

  if (filters.id) params.set("id", filters.id)
  if (filters.title) params.set("title", filters.title)
  if (filters.description) params.set("description", filters.description)
  if (filters.pushNotify) params.set("pushNotify", filters.pushNotify)
  if (filters.category) params.set("category", filters.category)
  if (filters.q) params.set("q", filters.q)

  return params.toString()
}

export default function Page() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [project, setProject] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  )
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  )
  const [debouncedQuery, setDebouncedQuery] = useState(
    searchParams.get("search") || ""
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  const initialSyncDone = useRef(false)
  const paramsRef = useRef(params)
  const routerRef = useRef(router)

  paramsRef.current = params
  routerRef.current = router

  const FIELD_SUGGESTIONS = [
    { label: "ID", value: "@id=" },
    { label: "Title", value: "@title=" },
    { label: "Description", value: "@description=" },
    { label: "Push Notify", value: "@pushNotify=" },
    { label: "Category", value: "@category=" },
    { label: "Context ID", value: "@contextId=" },
    { label: "Created At", value: "@createdAt=" },
  ]

  const [events, setEvents] = useState<EventItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const [loadingMore, setLoadingMore] = useState(false)
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    if (!initialSyncDone.current) {
      initialSyncDone.current = true
      return
    }

    const newParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    )
    if (debouncedQuery) {
      newParams.set("search", debouncedQuery)
    } else {
      newParams.delete("search")
    }

    if (selectedCategory && selectedCategory !== "all") {
      newParams.set("category", selectedCategory)
    } else {
      newParams.delete("category")
    }

    const queryString = newParams.toString()
    routerRef.current.replace(
      `/project/${paramsRef.current.id}${queryString ? `?${queryString}` : ""}`,
      { scroll: false }
    )
  }, [debouncedQuery, selectedCategory])

  const queryString = useMemo(
    () =>
      buildQueryString(selectedCategory, debouncedQuery, 1, EVENTS_PER_PAGE),
    [selectedCategory, debouncedQuery]
  )

  const currentQueryKey = useMemo(
    () => `${selectedCategory}:${debouncedQuery}`,
    [selectedCategory, debouncedQuery]
  )

  const fetchEvents = useCallback(
    async (pageNum: number, append: boolean) => {
      const url = `/api/v1/project/${params.id}/events?${buildQueryString(
        selectedCategory,
        debouncedQuery,
        pageNum,
        EVENTS_PER_PAGE
      )}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const newEvents = data.data.events ?? []
      const pagination = data.data.pagination

      setEvents((prev) => (append ? [...prev, ...newEvents] : newEvents))
      setPage(pagination?.page ?? pageNum)
      setHasMore((pagination?.page ?? pageNum) < (pagination?.pages ?? pageNum))
    },
    [params.id, selectedCategory, debouncedQuery]
  )

  useEffect(() => {
    const fetchInitial = async () => {
      const [projectRes, eventsRes, categoriesRes] = await Promise.all([
        fetch(`/api/v1/project/${params.id}`),
        fetch(`/api/v1/project/${params.id}/events?${queryString}`),
        fetch(`/api/v1/project/${params.id}/categories`),
      ])

      if (!projectRes.ok) {
        setNotFoundState(true)
        setLoading(false)
        return
      }

      const projectData = await projectRes.json()
      setProject(projectData.data)

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.data.events ?? [])
        setPage(eventsData.data.pagination?.page ?? 1)
        setHasMore(
          (eventsData.data.pagination?.page ?? 1) <
            (eventsData.data.pagination?.pages ?? 1)
        )
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const total = categoriesData.data?.total ?? 0
        const categoryList = categoriesData.data?.categories ?? []
        setCategories([{ name: "all", count: total }, ...categoryList])
      }

      setLoading(false)
    }

    fetchInitial()
  }, [params.id])

  useEffect(() => {
    if (loading) return

    setEvents([])
    setPage(1)
    setHasMore(true)
    setLoadingMore(true)

    fetchEvents(1, false).finally(() => {
      setLoadingMore(false)
    })
  }, [currentQueryKey])

  useEffect(() => {
    if (!sentinelRef.current || loading || !hasMore || loadingMore) return

    const loadMore = async () => {
      if (loadingMore || !hasMore) return
      setLoadingMore(true)
      await fetchEvents(page + 1, true)
      setLoadingMore(false)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loading, hasMore, loadingMore, page, fetchEvents])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (notFoundState) {
    return notFound()
  }

  return (
    <main>
      <div className="flex min-h-svh flex-col gap-3 py-6">
        <div className="flex flex-col gap-3">
          <Breadcrumb>
            <BreadcrumbList className="text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project?.name ?? "Project"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">Events</h1>

            <div className="flex items-center gap-2">
              <Button className="w-fit shrink-0" variant="default" size="sm">
                <Link href={`/project/${params.id}/settings`}>
                  Project Settings
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="hidden shrink-0 sm:block">
              <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            <div className="flex w-full min-w-0 flex-col gap-2">
              <div className="relative">
                <Search
                  className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={3}
                />
                <Input
                  ref={searchInputRef}
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  className="!text-md font-base h-10 rounded-xl border-0 !bg-card pr-[10.5rem] pl-9 focus-visible:ring-0 focus-visible:ring-offset-0 sm:pr-12"
                />
                <div className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1 pr-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none">
                      <SlidersHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        className="text-muted-foreground"
                        disabled
                      >
                        Field filters
                      </DropdownMenuItem>
                      {FIELD_SUGGESTIONS.map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => {
                            const quoted = `${item.value}""`
                            const newQuery = searchQuery
                              ? `${searchQuery} ${quoted} `
                              : `${quoted} `
                            setSearchQuery(newQuery)
                            requestAnimationFrame(() => {
                              const input = searchInputRef.current
                              if (!input) return
                              const pos = newQuery.lastIndexOf('"')
                              input.focus()
                              input.setSelectionRange(pos, pos)
                            })
                          }}
                        >
                          {item.value}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {item.label}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="sm:hidden">
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) =>
                        value && setSelectedCategory(value)
                      }
                    >
                      <SelectTrigger className="h-10 w-28 shrink-0 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 sm:w-32">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            <span className="capitalize">{cat.name}</span>
                            <span className="ml-1 text-muted-foreground">
                              ({cat.count})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(() => {
                  const tokens = searchQuery.trimEnd().split(/\s+/)
                  const lastToken = tokens[tokens.length - 1] ?? ""
                  const isOnlyAt = tokens.length === 1 && lastToken === "@"
                  const isTypingFilter =
                    lastToken.startsWith("@") &&
                    !lastToken.includes("=") &&
                    !isOnlyAt
                  if (!isTypingFilter) return null
                  const prefix = (
                    lastToken.slice(1).split("=")[0] ?? ""
                  ).toLowerCase()
                  const matches = FIELD_SUGGESTIONS.filter((item) => {
                    const itemField = (
                      item.value.slice(1).split("=")[0] ?? ""
                    ).toLowerCase()
                    return itemField.startsWith(prefix)
                  })
                  if (!showSuggestions || matches.length === 0) return null
                  return (
                    <div className="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-border/50 bg-popover p-1 shadow-md">
                      {matches.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const tokens = searchQuery.trimEnd().split(/\s+/)
                            const quoted = `${item.value}""`
                            tokens[tokens.length - 1] = quoted
                            const newQuery = tokens.join(" ") + " "
                            setSearchQuery(newQuery)
                            setShowSuggestions(false)
                            requestAnimationFrame(() => {
                              const input = searchInputRef.current
                              if (!input) return
                              const pos = newQuery.lastIndexOf('"')
                              input.focus()
                              input.setSelectionRange(pos, pos)
                            })
                          }}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          <span>{item.value}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
              {events.length === 0 && !loadingMore ? (
                debouncedQuery ? (
                  <div className="mt-4 flex min-h-[200px] flex-col items-center gap-2 rounded-lg text-center">
                    <p className="text-sm font-semibold text-foreground">
                      No results found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No events match &quot;{debouncedQuery}&quot;.
                    </p>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Getting Started with Event Logging
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Post an event to your project endpoint using any HTTP
                          client.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Endpoint
                        </p>
                        <code className="block rounded-md bg-black/30 p-3 font-mono text-xs break-all text-foreground">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/api/v1/log`
                            : "/api/v1/log"}
                        </code>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Example with cURL
                        </p>
                        <pre className="max-h-[200px] overflow-auto rounded-md bg-black/30 p-3 font-mono text-xs break-all whitespace-pre-wrap text-foreground">
                          {`curl -X POST \\
  ${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/log \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "name": "user.created",
    "description": "A new user signed up",
  }'`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Example with @uplabs/sdk
                        </p>
                        <pre className="max-h-[200px] overflow-auto rounded-md bg-black/30 p-3 font-mono text-xs break-all whitespace-pre-wrap text-foreground">
                          {`import { Upstream } from "@uplabs/sdk"

const ups = new Upstream({
  apiKey: "YOUR_API_KEY"
})

await ups.events.ingest({
  name: "user.created",
  description: "A new user signed up"
})`}
                        </pre>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Replace{" "}
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            YOUR_API_KEY
                          </code>{" "}
                          with an API key from{" "}
                          <Link
                            href={`/project/${params.id}/settings`}
                            className="font-medium text-foreground underline underline-offset-2"
                          >
                            Project Settings
                          </Link>
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        For more information, see the{" "}
                        <Link
                          href="https://ups.linuskang.au"
                          className="font-medium text-foreground underline underline-offset-2"
                        >
                          documentation
                        </Link>
                        .
                      </p>
                    </CardContent>
                  </Card>
                )
              ) : (
                <EventsList events={events} />
              )}

              {events.length > 0 && hasMore && (
                <div
                  ref={sentinelRef}
                  className="flex items-center justify-center py-4"
                >
                  {loadingMore && (
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
