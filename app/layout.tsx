import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import "./globals.css"

export const metadata: Metadata = {
  title: "CineStream — Movie Discovery Platform",
  description: "Discover, explore, and track movies from Bollywood, Hollywood, Korean, South Indian, and more.",
  generator: "v0.app",
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>{children}</Suspense>
          <MobileBottomNav />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
