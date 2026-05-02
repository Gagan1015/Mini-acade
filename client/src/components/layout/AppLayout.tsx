'use client'

import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner'

interface AppLayoutProps {
  children: ReactNode
  showFooter?: boolean
  variant?: 'default' | 'marketing'
}

export function AppLayout({
  children,
  showFooter = true,
  variant = 'default',
}: AppLayoutProps) {
  return (
    <div
      className={[
        'flex min-h-screen flex-col bg-[var(--background)]',
        variant === 'marketing' ? 'app-theme-marketing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Header variant={variant} />
      <AnnouncementBanner variant={variant} />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer variant={variant} />}
    </div>
  )
}
