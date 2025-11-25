import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SPAvatar SDK - Next.js iframe Example',
  description: 'SPAvatarKit SDK example using Next.js with iframe integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

