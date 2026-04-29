export type AppRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'

const ROLE_RANKS: Record<AppRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
}

export function getRoleRank(role: string) {
  return ROLE_RANKS[role as AppRole] ?? -1
}

export function canManageRole(actorRole: string, targetRole: string) {
  return getRoleRank(actorRole) > getRoleRank(targetRole)
}

export function canAssignRole(actorRole: string, nextRole: string) {
  return getRoleRank(actorRole) > getRoleRank(nextRole)
}
