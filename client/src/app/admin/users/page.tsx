import { prisma } from '@mini-arcade/db'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      createdAt: true,
    },
  })

  return (
    <AdminUsersClient
      users={users.map((u) => ({
        id: u.id,
        name: u.name ?? 'Unnamed',
        email: u.email ?? '',
        role: u.role,
        status: u.status,
        image: u.image,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  )
}
