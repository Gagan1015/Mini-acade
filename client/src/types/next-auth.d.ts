import 'next-auth'
import 'next-auth/jwt'

type AppRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
type AppStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: AppRole
      status: AppStatus
    }
  }

  interface User {
    role?: AppRole
    status?: AppStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: AppRole
    status?: AppStatus
  }
}
