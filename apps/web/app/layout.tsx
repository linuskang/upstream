import type { Metadata } from "next"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { GeistSans } from "geist/font/sans"
import { RegisterServiceWorker } from "@/components/register-sw"
import "@workspace/ui/styles/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { TRPCProvider } from "@/components/trpc-provider"

export const metadata: Metadata = {
  title: "Upstream",
  description: "Simple and open logging for your next project.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Upstream",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                            window.addEventListener('beforeinstallprompt', (e) => {
                                e.preventDefault();
                                window.deferredInstallPrompt = e;
                            });
                        `,
          }}
        />
      </head>
      <body
        className={`flex min-h-screen flex-col bg-background ${GeistSans.className}`}
      >
        <RegisterServiceWorker />
        <main className="flex-1">
          <TooltipProvider>
            <TRPCProvider>{children}</TRPCProvider>
            <Toaster position="top-center" />
          </TooltipProvider>
        </main>
      </body>
    </html>
  )
}
