'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, UserPlus, DoorOpen, ShieldCheck, Clock, CheckCheck, Megaphone } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

type Notification = {
  id: string
  type: 'new_user' | 'active_room' | 'admin_action' | 'announcement'
  title: string
  description: string
  image?: string | null
  href: string
  createdAt: string
}

type NotifCounts = {
  activeRooms: number
  newUsers: number
  recentActions: number
  announcements: number
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function NotifIcon({ type }: { type: Notification['type'] }) {
  const base = 'flex h-8 w-8 items-center justify-center rounded-full'
  switch (type) {
    case 'new_user':
      return <div className={`${base} bg-[var(--success-500)]/15 text-[var(--success-500)]`}><UserPlus className="h-4 w-4" /></div>
    case 'active_room':
      return <div className={`${base} bg-[var(--primary-500)]/15 text-[var(--primary-500)]`}><DoorOpen className="h-4 w-4" /></div>
    case 'admin_action':
      return <div className={`${base} bg-[var(--warning-500)]/15 text-[var(--warning-500)]`}><ShieldCheck className="h-4 w-4" /></div>
    case 'announcement':
      return <div className={`${base} bg-[var(--error-500)]/15 text-[var(--error-500)]`}><Megaphone className="h-4 w-4" /></div>
  }
}

function CountBadge({
  count,
  icon,
  label,
  className,
}: {
  count: number
  icon: ReactNode
  label: string
  className: string
}) {
  if (count <= 0) return null

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      {icon}
      {count} {label}
    </span>
  )
}

export function AdminNotifications() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [counts, setCounts] = useState<NotifCounts>({ activeRooms: 0, newUsers: 0, recentActions: 0, announcements: 0 })
  const [loading, setLoading] = useState(false)
  const [seen, setSeen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const totalCount = counts.activeRooms + counts.newUsers + counts.recentActions + counts.announcements

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setCounts(data.counts)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  const handleToggle = () => {
    setOpen((prev) => !prev)
    if (!open) setSeen(true)
  }

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        title="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {totalCount > 0 && !seen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--background)]">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <CountBadge
                    count={counts.activeRooms}
                    icon={<DoorOpen className="h-3 w-3" />}
                    label="live"
                    className="bg-[var(--primary-500)]/10 text-[var(--primary-500)]"
                  />
                  <CountBadge
                    count={counts.newUsers}
                    icon={<UserPlus className="h-3 w-3" />}
                    label="new"
                    className="bg-[var(--success-500)]/10 text-[var(--success-500)]"
                  />
                  <CountBadge
                    count={counts.recentActions}
                    icon={<ShieldCheck className="h-3 w-3" />}
                    label="actions"
                    className="bg-[var(--warning-500)]/10 text-[var(--warning-500)]"
                  />
                  <CountBadge
                    count={counts.announcements}
                    icon={<Megaphone className="h-3 w-3" />}
                    label="announcements"
                    className="bg-[var(--error-500)]/10 text-[var(--error-500)]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {totalCount > 0 && (
                  <button
                    onClick={() => setSeen(true)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => { fetchNotifications(); setSeen(false) }}
                  className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="flex items-center justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary-500)]" />
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)]">
                  <Bell className="mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">All clear — nothing new</p>
                </div>
              )}

              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => navigate(notif.href)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                >
                  {notif.image ? (
                    <UserAvatar src={notif.image} name={notif.description} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    <NotifIcon type={notif.type} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{notif.title}</p>
                    <p className="truncate text-xs text-[var(--text-tertiary)]">{notif.description}</p>
                  </div>
                  <span className="flex flex-shrink-0 items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                    <Clock className="h-3 w-3" />
                    {timeAgo(notif.createdAt)}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] p-2">
              <button
                onClick={() => navigate('/admin/logs')}
                className="w-full rounded-lg py-2 text-center text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              >
                View all activity logs →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
