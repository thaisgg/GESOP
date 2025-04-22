import type React from "react"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Acceptació/Renúncia reconeixement mèdic",
  description: "Formulari de consentiment mèdic",
  openGraph: {
    title: "Acceptació/Renúncia reconeixement mèdic",
    description: "Formulari de consentiment mèdic",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  )
}
