'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import {
  DoorOpen,
  Search,
  Users,
  Trophy,
  Clock,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface Room {
  id: string
  code: string
  gameId: string
  status: string
  creatorName: string
  creatorEmail: string
  playerCount: number
  gameResultCount: number
  createdAt: string
}

interface AdminRoomsClientProps {
  rooms: Room[]
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

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  WAITING: { label: 'Waiting', badge: 'badge-primary', dot: 'bg-[var(--primary-500)]' },
  PLAYING: { label: 'Playing', badge: 'badge-success', dot: 'bg-[var(--success-500)] animate-pulse' },
  FINISHED: { label: 'Finished', badge: 'badge-warning', dot: 'bg-[var(--warning-500)]' },
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const then = new Date(dateString)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminRoomsClient({ rooms }: AdminRoomsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [gameFilter, setGameFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filtered = rooms.filter((room) => {
    const matchSearch =
      !searchQuery ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.creatorEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchGame = gameFilter === 'ALL' || room.gameId === gameFilter
    const matchStatus = statusFilter === 'ALL' || room.status === statusFilter
    return matchSearch && matchGame && matchStatus
  })

  const stats = {
    total: rooms.length,
    waiting: rooms.filter((r) => r.status === 'WAITING').length,
    playing: rooms.filter((r) => r.status === 'PLAYING').length,
    finished: rooms.filter((r) => r.status === 'FINISHED').length,
  }

  const uniqueGames = [...new Set(rooms.map((r) => r.gameId))]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Rooms</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Monitor and manage game rooms across the platform
        </p>
      </div>

      {/* ── Quick Stats ── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: 'Total Rooms', value: stats.total, icon: DoorOpen, color: 'var(--primary-500)' },
          { label: 'Waiting', value: stats.waiting, icon: Clock, color: 'var(--primary-400)' },
          { label: 'Playing Now', value: stats.playing, icon: Users, color: 'var(--success-500)' },
          { label: 'Finished', value: stats.finished, icon: Trophy, color: 'var(--warning-500)' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)]">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}
              >
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by room code or creator…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="input appearance-none pr-8 sm:w-40"
            >
              <option value="ALL">All Games</option>
              {uniqueGames.map((g) => (
                <option key={g} value={g}>
                  {GAME_EMOJIS[g] || '🎮'} {g}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input appearance-none pr-8 sm:w-40"
            >
              <option value="ALL">All Status</option>
              <option value="WAITING">Waiting</option>
              <option value="PLAYING">Playing</option>
              <option value="FINISHED">Finished</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>
        </div>
      </div>

      {/* ── Rooms Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card overflow-hidden !p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Room Code
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Game
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Creator
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Players
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Results
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((room) => {
                  const statusInfo = STATUS_CONFIG[room.status] || STATUS_CONFIG.WAITING
                  const gameColor = GAME_COLORS[room.gameId] || 'var(--primary-500)'

                  return (
                    <tr
                      key={room.id}
                      className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      {/* Room code */}
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-xs font-bold tracking-widest"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${gameColor} 10%, transparent)`,
                            color: gameColor,
                          }}
                        >
                          {room.code}
                        </span>
                      </td>

                      {/* Game */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <span className="text-base">{GAME_EMOJIS[room.gameId] || '🎮'}</span>
                          <span className="capitalize">{room.gameId}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Creator */}
                      <td className="px-5 py-4">
                        <p className="text-[var(--text-secondary)]">{room.creatorName || room.creatorEmail}</p>
                      </td>

                      {/* Players */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          {room.playerCount}
                        </span>
                      </td>

                      {/* Results */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Trophy className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          {room.gameResultCount}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-5 py-4">
                        <div className="text-[var(--text-tertiary)]">
                          <p className="text-xs">{formatTimeAgo(room.createdAt)}</p>
                          <p className="text-[10px]">{formatDate(room.createdAt)}</p>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <DoorOpen className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      No rooms found
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-[var(--text-tertiary)]">
            Showing {filtered.length} of {rooms.length} rooms
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--success-500)]" />
            {stats.playing} live now
          </div>
        </div>
      </motion.div>
    </div>
  )
}
