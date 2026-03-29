'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import {
  Settings,
  Gamepad2,
  Megaphone,
  Power,
  Users,
  Clock,
  Layers,
  Save,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'

/* ── Types ── */

interface GameConfig {
  id: string
  gameId: string
  name: string
  description: string | null
  isEnabled: boolean
  minPlayers: number
  maxPlayers: number
  defaultRounds: number
  roundTime: number
}

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
  gameConfigs: GameConfig[]
  announcements: Announcement[]
}

const GAME_EMOJIS: Record<string, string> = {
  skribble: '🎨',
  trivia: '🧠',
  wordel: '📝',
  flagel: '🏳️',
}

const GAME_COLORS: Record<string, string> = {
  skribble: 'var(--game-skribble)',
  trivia: 'var(--game-trivia)',
  wordel: 'var(--game-wordel)',
  flagel: 'var(--game-flagel)',
}

const ANNOUNCEMENT_TYPE_CONFIG: Record<string, { icon: typeof Info; color: string; label: string }> = {
  info: { icon: Info, color: 'var(--primary-500)', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'var(--warning-500)', label: 'Warning' },
  error: { icon: AlertCircle, color: 'var(--error-500)', label: 'Critical' },
  success: { icon: CheckCircle2, color: 'var(--success-500)', label: 'Success' },
}

type Tab = 'games' | 'announcements'

/* ── Toast ── */

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
        type === 'success'
          ? 'border-[var(--success-500)]/20 bg-[var(--surface)]'
          : 'border-[var(--error-500)]/20 bg-[var(--surface)]'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-5 w-5 text-[var(--success-500)]" />
      ) : (
        <AlertCircle className="h-5 w-5 text-[var(--error-500)]" />
      )}
      <span className="text-sm font-medium text-[var(--text-primary)]">{message}</span>
      <button onClick={onClose} className="ml-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

/* ── Main Component ── */

export function AdminSettingsClient({ gameConfigs: initialGameConfigs, announcements: initialAnnouncements }: AdminSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('games')
  const [gameConfigs, setGameConfigs] = useState(initialGameConfigs)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [savingGame, setSavingGame] = useState<string | null>(null)
  const [editingGame, setEditingGame] = useState<string | null>(null)
  const [gameEdits, setGameEdits] = useState<Record<string, Partial<GameConfig>>>({})

  // Announcement form
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info',
  })
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── Game Config Actions ── */

  async function toggleGame(gameId: string, isEnabled: boolean) {
    setSavingGame(gameId)
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      })
      if (res.ok) {
        const updated = await res.json()
        setGameConfigs((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, ...updated } : g)))
        showToast(`${gameId} ${isEnabled ? 'enabled' : 'disabled'}`)
      } else {
        showToast('Failed to update game', 'error')
      }
    } catch {
      showToast('Failed to update game', 'error')
    } finally {
      setSavingGame(null)
    }
  }

  async function saveGameConfig(gameId: string) {
    const edits = gameEdits[gameId]
    if (!edits) return

    setSavingGame(gameId)
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      })
      if (res.ok) {
        const updated = await res.json()
        setGameConfigs((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, ...updated } : g)))
        setGameEdits((prev) => {
          const next = { ...prev }
          delete next[gameId]
          return next
        })
        setEditingGame(null)
        showToast(`${gameId} settings saved`)
      } else {
        showToast('Failed to save settings', 'error')
      }
    } catch {
      showToast('Failed to save settings', 'error')
    } finally {
      setSavingGame(null)
    }
  }

  function updateGameEdit(gameId: string, field: string, value: number) {
    setGameEdits((prev) => ({
      ...prev,
      [gameId]: { ...prev[gameId], [field]: value },
    }))
  }

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
        showToast('Announcement created')
      } else {
        showToast('Failed to create announcement', 'error')
      }
    } catch {
      showToast('Failed to create announcement', 'error')
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
        showToast(`Announcement ${isActive ? 'activated' : 'deactivated'}`)
      }
    } catch {
      showToast('Failed to update announcement', 'error')
    }
  }

  async function deleteAnnouncement(id: string) {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        showToast('Announcement deleted')
      }
    } catch {
      showToast('Failed to delete announcement', 'error')
    }
  }

  /* ── Render ── */

  const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
    { id: 'games', label: 'Game Configuration', icon: Gamepad2 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Configure game settings and manage platform announcements
        </p>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--primary-500)]/10 text-[var(--primary-400)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Game Configuration Tab ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {gameConfigs.length > 0 ? (
                gameConfigs.map((game) => {
                  const emoji = GAME_EMOJIS[game.gameId] || '🎮'
                  const color = GAME_COLORS[game.gameId] || 'var(--primary-500)'
                  const isEditing = editingGame === game.gameId
                  const isSaving = savingGame === game.gameId
                  const edits = gameEdits[game.gameId] || {}

                  const currentValues = {
                    minPlayers: edits.minPlayers ?? game.minPlayers,
                    maxPlayers: edits.maxPlayers ?? game.maxPlayers,
                    defaultRounds: edits.defaultRounds ?? game.defaultRounds,
                    roundTime: edits.roundTime ?? game.roundTime,
                  }

                  return (
                    <motion.div
                      key={game.id}
                      variants={staggerItem}
                      className="card group relative overflow-hidden"
                    >
                      {/* Accent */}
                      <div
                        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                        style={{ backgroundColor: color }}
                      />

                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                            }}
                          >
                            {emoji}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">
                              {game.name}
                            </h3>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {game.description || `Game ID: ${game.gameId}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Enable/disable toggle */}
                          <button
                            onClick={() => toggleGame(game.gameId, !game.isEnabled)}
                            disabled={isSaving}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                              game.isEnabled ? 'bg-[var(--success-500)]' : 'bg-[var(--border-strong)]'
                            } ${isSaving ? 'opacity-50' : ''}`}
                            title={game.isEnabled ? 'Disable game' : 'Enable game'}
                          >
                            <motion.span
                              animate={{ x: game.isEnabled ? 22 : 3 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
                            />
                          </button>

                          {/* Edit / Save */}
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingGame(null)
                                  setGameEdits((prev) => {
                                    const next = { ...prev }
                                    delete next[game.gameId]
                                    return next
                                  })
                                }}
                                className="btn btn-ghost btn-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveGameConfig(game.gameId)}
                                disabled={isSaving || Object.keys(edits).length === 0}
                                className="btn btn-primary btn-sm"
                              >
                                <Save className="h-3.5 w-3.5" />
                                {isSaving ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingGame(game.gameId)}
                              className="btn btn-secondary btn-sm"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              Configure
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Config Fields */}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-4">
                              {/* Min Players */}
                              <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                                  <Users className="h-3.5 w-3.5" />
                                  Min Players
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={currentValues.minPlayers}
                                  onChange={(e) =>
                                    updateGameEdit(game.gameId, 'minPlayers', Number(e.target.value))
                                  }
                                  className="input text-center"
                                />
                              </div>

                              {/* Max Players */}
                              <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                                  <Users className="h-3.5 w-3.5" />
                                  Max Players
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={currentValues.maxPlayers}
                                  onChange={(e) =>
                                    updateGameEdit(game.gameId, 'maxPlayers', Number(e.target.value))
                                  }
                                  className="input text-center"
                                />
                              </div>

                              {/* Default Rounds */}
                              <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                                  <Layers className="h-3.5 w-3.5" />
                                  Rounds
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={currentValues.defaultRounds}
                                  onChange={(e) =>
                                    updateGameEdit(game.gameId, 'defaultRounds', Number(e.target.value))
                                  }
                                  className="input text-center"
                                />
                              </div>

                              {/* Round Time */}
                              <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                                  <Clock className="h-3.5 w-3.5" />
                                  Round Time (s)
                                </label>
                                <input
                                  type="number"
                                  min={10}
                                  max={300}
                                  value={currentValues.roundTime}
                                  onChange={(e) =>
                                    updateGameEdit(game.gameId, 'roundTime', Number(e.target.value))
                                  }
                                  className="input text-center"
                                />
                              </div>
                            </div>

                            {/* Current config summary */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {[
                                { label: `${currentValues.minPlayers}–${currentValues.maxPlayers} players`, icon: Users },
                                { label: `${currentValues.defaultRounds} rounds`, icon: Layers },
                                { label: `${currentValues.roundTime}s per round`, icon: Clock },
                              ].map((item) => (
                                <span
                                  key={item.label}
                                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--text-tertiary)] border border-[var(--border-subtle)]"
                                >
                                  <item.icon className="h-3 w-3" />
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Quick stats when collapsed */}
                      {!isEditing && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className={`badge ${game.isEnabled ? 'badge-success' : 'badge-error'}`}>
                            <Power className="mr-1 h-3 w-3" />
                            {game.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <span className="badge badge-primary">
                            <Users className="mr-1 h-3 w-3" />
                            {game.minPlayers}–{game.maxPlayers} players
                          </span>
                          <span className="badge badge-primary">
                            <Layers className="mr-1 h-3 w-3" />
                            {game.defaultRounds} rounds
                          </span>
                          <span className="badge badge-primary">
                            <Clock className="mr-1 h-3 w-3" />
                            {game.roundTime}s
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )
                })
              ) : (
                <div className="card py-16 text-center">
                  <Gamepad2 className="mx-auto mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    No game configs found
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Run the database seed to create default game configurations
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── Announcements Tab ── */}
        {activeTab === 'announcements' && (
          <motion.div
            key="announcements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
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
                            onClick={() => deleteAnnouncement(announcement.id)}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
