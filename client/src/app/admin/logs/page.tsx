import { prisma } from '@mini-arcade/db'
import { AdminLogsClient } from '@/components/admin/AdminLogsClient'

export default async function AdminLogsPage() {
  const logs = await prisma.adminLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: { email: true, name: true, role: true },
      },
    },
  })

  return (
    <AdminLogsClient
      logs={logs.map((log) => ({
        id: log.id,
        action: log.action,
        actorName: log.actor.name ?? 'Unknown',
        actorEmail: log.actor.email ?? '',
        actorRole: log.actor.role,
        targetType: log.targetType,
        targetId: log.targetId,
        createdAt: log.createdAt.toISOString(),
      }))}
    />
  )
}
