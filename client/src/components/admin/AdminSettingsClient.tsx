'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import {
  Megaphone,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { useToast } from '@/components/ui/Toast'

/* ── Types ── */

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  isActive: boolean
  startsAt: string
  endsAt: string | null
  createdAt: string
}

interface AdminSettingsClientProps {
  announcements: Announcement[]
}

const ANNOUNCEMENT_TYPE_CONFIG: Record<string, { icon: typeof Info; color: string; label: string }> = {
  info: { icon: Info, color: 'var(--primary-500)', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'var(--warning-500)', label: 'Warning' },
  error: { icon: AlertCircle, color: 'var(--error-500)', label: 'Critical' },
  success: { icon: CheckCircle2, color: 'var(--success-500)', label: 'Success' },
}

/* ── Main Component ── */

export function AdminSettingsClient({ announcements: initialAnnouncements }: AdminSettingsClientProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const toast = useToast()

  // Announcement form
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info',
  })
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null)

  /* ── Announcement Actions ── */

  async function createAnnouncement() {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) return

    setCreatingAnnouncement(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement),
      })
      if (res.ok) {
        const created = await res.json()
        setAnnouncements((prev) => [
          {
            ...created,
            startsAt: created.startsAt ?? new Date().toISOString(),
            createdAt: created.createdAt ?? new Date().toISOString(),
          },
          ...prev,
        ])
        setNewAnnouncement({ title: '', message: '', type: 'info' })
        setShowNewAnnouncement(false)
        toast.success('Announcement created')
      } else {
        toast.error('Failed to create announcement')
      }
    } catch {
      toast.error('Failed to create announcement')
    } finally {
      setCreatingAnnouncement(false)
    }
  }

  async function toggleAnnouncement(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (res.ok) {
        setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)))
        toast.success(`Announcement ${isActive ? 'activated' : 'deactivated'}`)
      }
    } catch {
      toast.error('Failed to update announcement')
    }
  }

  async function deleteAnnouncement(id: string) {
    setDeletingAnnouncementId(id)
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        setAnnouncementToDelete(null)
        toast.success('Announcement deleted')
      } else {
        toast.error('Failed to delete announcement')
      }
    } catch {
      toast.error('Failed to delete announcement')
    } finally {
      setDeletingAnnouncementId(null)
    }
  }

  /* ── Render ── */

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Announcements</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Publish platform-wide announcements that surface in the lobby and landing experiences.
        </p>
      </div>

      <div className="space-y-4">
            {/* New Announcement Button / Form */}
            <AnimatePresence>
              {showNewAnnouncement ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card overflow-hidden"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      New Announcement
                    </h3>
                    <button
                      onClick={() => setShowNewAnnouncement(false)}
                      className="btn btn-ghost btn-sm !p-1.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                        Title
                      </label>
                      <input
                        type="text"
                        value={newAnnouncement.title}
                        onChange={(e) =>
                          setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Announcement title…"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                        Message
                      </label>
                      <textarea
                        value={newAnnouncement.message}
                        onChange={(e) =>
                          setNewAnnouncement((prev) => ({ ...prev, message: e.target.value }))
                        }
                        placeholder="Write your announcement message…"
                        rows={3}
                        className="input resize-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                        Type
                      </label>
                      <div className="flex gap-2">
                        {Object.entries(ANNOUNCEMENT_TYPE_CONFIG).map(([type, config]) => {
                          const TypeIcon = config.icon
                          return (
                            <button
                              key={type}
                              onClick={() =>
                                setNewAnnouncement((prev) => ({ ...prev, type }))
                              }
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                newAnnouncement.type === type
                                  ? 'border-[var(--primary-500)]/30 bg-[var(--primary-500)]/10 text-[var(--primary-400)]'
                                  : 'border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)]'
                              }`}
                            >
                              <TypeIcon className="h-3.5 w-3.5" style={{ color: config.color }} />
                              {config.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                      <button
                        onClick={() => setShowNewAnnouncement(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createAnnouncement}
                        disabled={creatingAnnouncement || !newAnnouncement.title.trim() || !newAnnouncement.message.trim()}
                        className="btn btn-primary btn-sm"
                      >
                        <Megaphone className="h-3.5 w-3.5" />
                        {creatingAnnouncement ? 'Creating…' : 'Publish'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowNewAnnouncement(true)}
                  className="card card-hover flex w-full items-center justify-center gap-2 border-dashed py-5 text-sm font-medium text-[var(--text-tertiary)] transition-all hover:text-[var(--primary-400)]"
                >
                  <Plus className="h-4 w-4" />
                  Create New Announcement
                </motion.button>
              )}
            </AnimatePresence>

            {/* Announcements List */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {announcements.length > 0 ? (
                announcements.map((announcement) => {
                  const typeConfig = ANNOUNCEMENT_TYPE_CONFIG[announcement.type] || ANNOUNCEMENT_TYPE_CONFIG.info
                  const TypeIcon = typeConfig.icon

                  return (
                    <motion.div
                      key={announcement.id}
                      variants={staggerItem}
                      className="card group relative overflow-hidden"
                    >
                      {/* Type indicator bar */}
                      <div
                        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                        style={{ backgroundColor: typeConfig.color }}
                      />

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${typeConfig.color} 15%, transparent)`,
                            }}
                          >
                            <TypeIcon className="h-5 w-5" style={{ color: typeConfig.color }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                                {announcement.title}
                              </h4>
                              <span
                                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${typeConfig.color} 10%, transparent)`,
                                  color: typeConfig.color,
                                }}
                              >
                                {typeConfig.label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
                              {announcement.message}
                            </p>
                            <p className="mt-2 text-[10px] text-[var(--text-tertiary)]">
                              Created{' '}
                              {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              {announcement.endsAt && (
                                <>
                                  {' '}· Expires{' '}
                                  {new Date(announcement.endsAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          {/* Active toggle */}
                          <button
                            onClick={() => toggleAnnouncement(announcement.id, !announcement.isActive)}
                            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                              announcement.isActive ? 'bg-[var(--success-500)]' : 'bg-[var(--border-strong)]'
                            }`}
                            title={announcement.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <motion.span
                              animate={{ x: announcement.isActive ? 18 : 3 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
                            />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setAnnouncementToDelete(announcement)}
                            className="btn btn-ghost btn-sm !p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error-500)]"
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="card py-16 text-center">
                  <Megaphone className="mx-auto mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    No announcements yet
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Create one to notify your users
                  </p>
                </div>
              )}
            </motion.div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {announcementToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-announcement-title"
          >
            <button
              type="button"
              aria-label="Close delete confirmation"
              className="absolute inset-0"
              onClick={() => {
                if (!deletingAnnouncementId) setAnnouncementToDelete(null)
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl"
            >
              <div className="border-b border-[var(--border)] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--error-500)]/10 text-[var(--error-500)]">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--error-500)]">
                        Delete announcement
                      </p>
                      <h2 id="delete-announcement-title" className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                        Remove this announcement?
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnnouncementToDelete(null)}
                    disabled={Boolean(deletingAnnouncementId)}
                    className="btn btn-ghost btn-sm !p-2"
                    aria-label="Close confirmation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  This will permanently delete the announcement and remove it from the public banner feed.
                </p>

                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {announcementToDelete.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                    {announcementToDelete.message}
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setAnnouncementToDelete(null)}
                    disabled={Boolean(deletingAnnouncementId)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteAnnouncement(announcementToDelete.id)}
                    disabled={deletingAnnouncementId === announcementToDelete.id}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--error-500)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingAnnouncementId === announcementToDelete.id ? 'Deleting...' : 'Delete announcement'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  )
}
