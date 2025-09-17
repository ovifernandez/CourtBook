import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'CourtBook',
  description: 'Created by ovifernandez & podolski',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Suspense boundary para hooks de navegación como useSearchParams */}
        <Suspense fallback={<div />}>
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
