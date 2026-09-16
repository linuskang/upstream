import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-background p-10 text-center ring-1">
        <CardHeader className="gap-2 pb-2">
          <CardTitle className="text-7xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-medium">Page not found</p>
            <p className="text-sm text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <Link href="/">
            <Button className="h-10 w-full cursor-pointer gap-2 text-sm font-bold">
              Back to home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
