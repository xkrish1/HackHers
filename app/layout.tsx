import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Equilibria - Burnout Radar",
  description:
    "Monitor and manage burnout risk with AI-powered insights and actionable recommendations.",
}

export const viewport: Viewport = {
  themeColor: "#0b1120",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      {/*
        suppressHydrationWarning: some browser extensions (eg. Grammarly) inject
        attributes into the DOM after the page loads which causes a hydration
        mismatch between server HTML and client DOM. Adding this flag avoids
        the mismatch warning for the body subtree. If you prefer, target a
        narrower element instead of the whole body.
      */}
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  )
}
