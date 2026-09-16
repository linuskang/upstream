import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "@workspace/ui/globals.css"

export const metadata: Metadata = {
  title: "Upstream: Simple and open events logging for your SaSS project.",
  description:
    "Easily log product events from your SaSS and view them on your phone at a glance.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
