'use client'

import { Search, Bell, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminTopBarProps {
  userEmail: string
}

export function AdminTopBar({ userEmail: _userEmail }: AdminTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Search — offset on mobile for hamburger */}
      <div className="relative max-w-md flex-1 pl-12 lg:pl-0">
        <Search className="absolute left-[60px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] lg:left-3" />
        <input
          type="text"
          placeholder="Search users, rooms, games…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
        <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)] sm:inline">
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="btn btn-ghost btn-sm"
          title="Refresh data"
        >
          <RefreshCw className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <button className="btn btn-ghost btn-sm relative" title="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--primary-500)] ring-2 ring-[var(--background)]" />
        </button>
      </div>
    </header>
  )
}
