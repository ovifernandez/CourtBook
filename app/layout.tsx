import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "CourtBook Boadilla - Reservas de Tenis",
  description: "Sistema de reservas de pistas de tenis para vecinos de Boadilla",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="font-sans min-h-screen bg-background text-foreground">
        <Suspense fallback={<div>Loading...</div>}>
          <main role="main">{children}</main>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
