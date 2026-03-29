'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  const user = session?.user
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login: (provider?: 'google' | 'github', callbackUrl?: string) =>
      signIn(provider, { callbackUrl }),
    logout: (callbackUrl?: string) => signOut({ callbackUrl: callbackUrl ?? '/' }),
  }
}
