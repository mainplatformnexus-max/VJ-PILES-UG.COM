import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { SubscriptionProvider } from "@/lib/subscription-context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VJ PILES UG MOVIES - Stream & Download",
  description: "Stream and download your favorite movies and shows on VJ PILES UG MOVIES",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VJ PILES UG MOVIES",
  },
  applicationName: "VJ PILES UG MOVIES",
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#141620" />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider defaultTheme="dark" attribute="class" enableSystem>
          <AuthProvider>
            <SubscriptionProvider>{children}</SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
