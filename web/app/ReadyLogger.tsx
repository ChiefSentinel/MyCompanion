// web/app/layout.tsx
import { PropsWithChildren } from 'react'
import { Metadata } from 'next'

import '@/styles/main.scss'
import ReadyLogger from './ReadyLogger'

export const metadata: Metadata = {
  title: 'Jan',
  description:
    'Self-hosted, local, AI Inference Platform that scales from personal use to production deployments for a team.',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen font-sans text-sm antialiased">
        {/* Client-side logger to signal when React has fully hydrated */}
        <ReadyLogger />
        {children}
      </body>
    </html>
  )
}

