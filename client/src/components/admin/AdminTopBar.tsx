'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { AdminCommandPalette } from './AdminCommandPalette'
import { AdminNotifications } from './AdminNotifications'

interface AdminTopBarProps {
  userEmail: string
}

export function AdminTopBar({ userEmail: _userEmail }: AdminTopBarProps) {
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Search — command palette trigger */}
      <div className="max-w-md flex-1 pl-12 lg:pl-0">
        <AdminCommandPalette />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          title="Refresh data"
        >
          <RefreshCw className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <AdminNotifications />
      </div>
    </header>
  )
}
