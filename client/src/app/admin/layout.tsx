import type { ReactNode } from 'react'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { requireAdminSession } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requireAdminSession()

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar (includes its own spacer div) */}
      <AdminSidebar
        userName={session.user.name ?? 'Admin'}
        userEmail={session.user.email ?? ''}
        userImage={session.user.image ?? undefined}
        userRole={session.user.role}
      />

      {/* Main content area — no fixed left padding, sidebar spacer handles it */}
      <div className="flex flex-1 flex-col min-w-0">
        <AdminTopBar userEmail={session.user.email ?? ''} />
        <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
