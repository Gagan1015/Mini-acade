'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Megaphone, X } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
}

interface AnnouncementBannerProps {
  variant?: 'default' | 'marketing'
}

const TYPE_STYLES: Record<string, { accent: string; bg: string; border: string; iconBg: string }> = {
  info: {
    accent: 'var(--primary-400)',
    bg: 'var(--surface)',
    border: 'var(--border)',
    iconBg: 'var(--primary-500)',
  },
  warning: {
    accent: 'var(--warning-500)',
    bg: '#1a1708',
    border: '#3d3510',
    iconBg: 'var(--warning-500)',
  },
  error: {
    accent: 'var(--error-500)',
    bg: '#1a0808',
    border: '#3d1010',
    iconBg: 'var(--error-500)',
  },
  success: {
    accent: 'var(--success-500)',
    bg: '#081a0e',
    border: '#103d1a',
    iconBg: 'var(--success-500)',
  },
}

export function AnnouncementBanner({ variant = 'default' }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load dismissed IDs from sessionStorage
    try {
      const stored = sessionStorage.getItem('dismissed-announcements')
      if (stored) setDismissed(new Set(JSON.parse(stored)))
    } catch {
      // ignore
    }

    fetch('/api/announcements')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Announcement[]) => setAnnouncements(data))
      .catch(() => {})
  }, [])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        sessionStorage.setItem('dismissed-announcements', JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id))

  if (visible.length === 0) return null

  const bannerListClassName =
    variant === 'marketing'
      ? 'mx-auto w-full max-w-7xl px-6 pt-4 lg:px-8'
      : 'mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8'

  const bannerList = (
    <div className={bannerListClassName}>
      <AnimatePresence>
        {visible.map((announcement) => {
          const styles = TYPE_STYLES[announcement.type] || TYPE_STYLES.info

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-2"
            >
              <div
                className="relative flex items-center gap-3 overflow-hidden rounded-xl border px-4 py-2.5"
                style={{ backgroundColor: styles.bg, borderColor: styles.border }}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                  style={{ backgroundColor: styles.accent }}
                />
                <div
                  className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `color-mix(in srgb, ${styles.iconBg} 15%, transparent)` }}
                >
                  <Megaphone className="h-3 w-3" style={{ color: styles.accent }} />
                </div>
                <p className="flex-1 text-[13px] leading-snug">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {announcement.title}
                  </span>
                  <span className="mx-1.5 text-[var(--text-tertiary)]">·</span>
                  <span className="text-[var(--text-secondary)]">
                    {announcement.message}
                  </span>
                </p>
                <button
                  onClick={() => dismiss(announcement.id)}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )

  if (variant !== 'marketing') {
    return bannerList
  }

  return (
    <div className="marketing-rail-layout bg-[var(--background)]">
      <section className="marketing-rail-section">{bannerList}</section>
    </div>
  )
}
