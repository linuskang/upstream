"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
import type { Project, RequestLog } from "@workspace/contracts"

const chartConfig = {
  requests: {
    label: "Requests",
    color: "#e7e5e5",
  },
} satisfies ChartConfig

const STATUS_RANGE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
] as const

export default function AnalyticsPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [projectRes, logsRes] = await Promise.all([
        fetch(`/api/v1/project/${params.id}`),
        fetch(`/api/v1/project/${params.id}/requests`),
      ])
      if (!projectRes.ok || !logsRes.ok) return
      const projectData = await projectRes.json()
      const logsData = await logsRes.json()
      setProject(projectData.data)
      setRequestLogs(logsData.data)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of requestLogs) {
      const day = new Date(log.createdAt).toLocaleDateString("en-CA")
      map.set(day, (map.get(day) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, requests]) => ({ date, requests }))
  }, [requestLogs])

  const { statusData, statusChartConfig } = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of requestLogs) {
      const key = `${Math.floor(log.status / 100)}xx`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    const ranges = ["2xx", "3xx", "4xx", "5xx"] as const
    const data: { status: string; count: number }[] = []
    const config: ChartConfig = {}
    let colorIdx = 0
    for (const range of ranges) {
      const count = map.get(range) ?? 0
      if (count > 0) {
        data.push({ status: range, count })
        config[range] = {
          label: range,
          color: STATUS_RANGE_COLORS[colorIdx],
        }
        colorIdx++
      }
    }
    return { statusData: data, statusChartConfig: config }
  }, [requestLogs])

  const requestsThisWeek = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    startOfWeek.setHours(0, 0, 0, 0)
    return requestLogs.filter((log) => new Date(log.createdAt) >= startOfWeek)
      .length
  }, [requestLogs])

  const methodData = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of requestLogs) {
      map.set(log.method, (map.get(log.method) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([method, count]) => ({ method, count }))
  }, [requestLogs])

  const methodChartConfig = {
    count: { label: "Requests", color: "#e7e5e5" },
  } satisfies ChartConfig

  const endpointData = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of requestLogs) {
      map.set(log.endpoint, (map.get(log.endpoint) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))
  }, [requestLogs])

  const endpointChartConfig = useMemo(() => {
    const config: ChartConfig = {}
    endpointData.forEach((item, i) => {
      config[item.endpoint] = {
        label: item.endpoint,
        color: `var(--chart-${(i % 5) + 1})`,
      }
    })
    return config
  }, [endpointData])

  if (loading) {
    return (
      <main>
        <div className="flex min-h-svh flex-col gap-3 py-6">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </main>
    )
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
                <BreadcrumbLink href={`/project/${params.id}`}>
                  {project?.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">
            {project?.name} Analytics
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Weekly Requests
              </p>
              <p className="text-xl font-bold text-foreground">
                {requestsThisWeek} <span className="text-sm">requests</span>
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Success Rate
              </p>
              <p className="text-xl font-bold text-foreground">
                {requestLogs.length > 0
                  ? `${(
                      (requestLogs.filter(
                        (log) => log.status >= 200 && log.status < 300
                      ).length /
                        requestLogs.length) *
                      100
                    ).toFixed(2)}%`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Error Rate
              </p>
              <p className="text-xl font-bold text-foreground">
                {requestLogs.length > 0
                  ? `${(
                      (requestLogs.filter(
                        (log) => log.status < 200 || log.status >= 300
                      ).length /
                        requestLogs.length) *
                      100
                    ).toFixed(2)}%`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <Card className="ring-0">
          <CardHeader>
            <CardTitle className="font-semibold">Requests Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ left: -20 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const d = new Date(value)
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="requests"
                  fill="var(--color-requests)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="ring-0">
          <CardHeader>
            <CardTitle className="font-semibold">Requests by Method</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={methodChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={methodData}
                margin={{ left: -20 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="method"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="ring-0">
          <CardHeader className="items-center pb-4">
            <CardTitle className="font-semibold">Top Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer
              config={endpointChartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Pie
                  data={endpointData}
                  dataKey="count"
                  nameKey="endpoint"
                  innerRadius={50}
                  strokeWidth={2}
                  labelLine={false}
                >
                  {endpointData.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="ring-0">
          <CardHeader className="items-center pb-4">
            <CardTitle className="font-semibold">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer
              config={statusChartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  strokeWidth={2}
                  labelLine={false}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={`var(--color-${entry.status})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
