'use client'

import { motion } from 'motion/react'
import { useState, useRef, useCallback } from 'react'
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  MoreVertical,
  Ban,
  CheckCircle2,
  PauseCircle,
  UserCog,
  ChevronDown,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { staggerContainer, staggerItem } from '@/lib/motion'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  image: string | null
  createdAt: string
}

interface AdminUsersClientProps {
  users: User[]
}

const ROLE_CONFIG: Record<string, { label: string; badge: string; icon: typeof Shield }> = {
  USER: { label: 'User', badge: 'badge-primary', icon: Shield },
  MODERATOR: { label: 'Moderator', badge: 'badge-warning', icon: ShieldCheck },
  ADMIN: { label: 'Admin', badge: 'badge-success', icon: ShieldAlert },
  SUPER_ADMIN: { label: 'Super Admin', badge: 'badge-error', icon: Crown },
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  ACTIVE: { label: 'Active', badge: 'badge-success', dot: 'bg-[var(--success-500)]' },
  SUSPENDED: { label: 'Suspended', badge: 'badge-warning', dot: 'bg-[var(--warning-500)]' },
  BANNED: { label: 'Banned', badge: 'badge-error', dot: 'bg-[var(--error-500)]' },
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminUsersClient({ users: initialUsers }: AdminUsersClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; openUp: boolean } | null>(null)
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const dropdownBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const openDropdown = useCallback((userId: string) => {
    if (activeDropdown === userId) {
      setActiveDropdown(null)
      setDropdownPos(null)
      return
    }
    const btn = dropdownBtnRefs.current[userId]
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < 280
      setDropdownPos({
        top: openUp ? rect.top : rect.bottom + 4,
        left: rect.right - 192, // 192 = w-48
        openUp,
      })
    }
    setActiveDropdown(userId)
  }, [activeDropdown])

  const closeDropdown = useCallback(() => {
    setActiveDropdown(null)
    setDropdownPos(null)
  }, [])

  const filtered = users.filter((user) => {
    const matchSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchStatus = statusFilter === 'ALL' || user.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'ACTIVE').length,
    suspended: users.filter((u) => u.status === 'SUSPENDED').length,
    banned: users.filter((u) => u.status === 'BANNED').length,
  }

  async function updateUser(userId: string, data: { role?: string; status?: string }) {
    setLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, role: updated.role ?? u.role, status: updated.status ?? u.status }
              : u,
          ),
        )
      }
    } catch {
      // silently fail
    } finally {
      setLoading(null)
      closeDropdown()
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage user accounts, roles, and permissions
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
          { label: 'Total Users', value: stats.total, color: 'var(--primary-500)' },
          { label: 'Active', value: stats.active, color: 'var(--success-500)' },
          { label: 'Suspended', value: stats.suspended, color: 'var(--warning-500)' },
          { label: 'Banned', value: stats.banned, color: 'var(--error-500)' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem} className="card">
            <p className="text-xs font-medium text-[var(--text-tertiary)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Role filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input appearance-none pr-8 sm:w-40"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input appearance-none pr-8 sm:w-40"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          </div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card !p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  User
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Role
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Joined
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((user) => {
                  const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG.USER
                  const statusInfo = STATUS_CONFIG[user.status] || STATUS_CONFIG.ACTIVE
                  const RoleIcon = roleInfo.icon

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-hover)] ${
                        loading === user.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* User info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-9 w-9 rounded-full ring-2 ring-[var(--border)]"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-500)]/15 text-sm font-bold text-[var(--primary-400)]">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--text-primary)]">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-[var(--text-tertiary)]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`badge ${roleInfo.badge} inline-flex items-center gap-1.5`}>
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-[var(--text-tertiary)]">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="btn btn-ghost btn-sm !p-1.5"
                            title="View user details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            ref={(el) => { dropdownBtnRefs.current[user.id] = el }}
                            onClick={() => openDropdown(user.id)}
                            className="btn btn-ghost btn-sm !p-1.5"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      No users found
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

        {/* Dropdown portal — rendered outside the overflow container */}
        {activeDropdown && dropdownPos && (() => {
          const user = users.find((u) => u.id === activeDropdown)
          if (!user) return null
          return (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={closeDropdown}
              />
              <div
                className="fixed z-[9999] w-48 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl"
                style={{
                  top: dropdownPos.openUp ? undefined : dropdownPos.top,
                  bottom: dropdownPos.openUp ? window.innerHeight - dropdownPos.top + 4 : undefined,
                  left: dropdownPos.left,
                }}
              >
                {/* Role changes */}
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                  Change Role
                </p>
                {(['USER', 'MODERATOR', 'ADMIN'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => updateUser(user.id, { role })}
                    disabled={user.role === role}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-30"
                  >
                    <UserCog className="h-3.5 w-3.5" />
                    Set as {ROLE_CONFIG[role]?.label}
                  </button>
                ))}

                <div className="my-1 border-t border-[var(--border)]" />

                {/* Status changes */}
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                  Status
                </p>
                {user.status !== 'ACTIVE' && (
                  <button
                    onClick={() => updateUser(user.id, { status: 'ACTIVE' })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--success-500)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Activate
                  </button>
                )}
                {user.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => updateUser(user.id, { status: 'SUSPENDED' })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--warning-500)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    Suspend
                  </button>
                )}
                {user.status !== 'BANNED' && (
                  <button
                    onClick={() => updateUser(user.id, { status: 'BANNED' })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--error-500)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Ban User
                  </button>
                )}

                <div className="my-1 border-t border-[var(--border)]" />

                <Link
                  href={`/admin/users/${user.id}`}
                  onClick={closeDropdown}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </Link>
              </div>
            </>
          )
        })()}

        {/* Table footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-[var(--text-tertiary)]">
            Showing {filtered.length} of {users.length} users
          </p>
        </div>
      </motion.div>
    </div>
  )
}
