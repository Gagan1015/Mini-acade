'use client'

import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

interface AppLayoutProps {
  children: ReactNode
  showFooter?: boolean
}

export function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
