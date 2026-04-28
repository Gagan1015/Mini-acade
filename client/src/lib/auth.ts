import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@arcado/db'
import type { DefaultSession, NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

type AppRole = NonNullable<DefaultSession['user']> & {
  role: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
}

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

// The Socket.IO server runs on a sibling subdomain (e.g. api.arcado.example.com)
// of the Next.js app (arcado.example.com). For the server to authenticate the
// socket from the NextAuth session cookie, the cookie's Domain attribute must
// cover both hosts. Derive `.<parent>` from NEXTAUTH_URL's hostname so the
// cookie is shared across siblings. Falls back to host-only (NextAuth default)
// when running on localhost or a bare hostname.
const nextAuthUrl = process.env.NEXTAUTH_URL ?? ''
const useSecureCookies = nextAuthUrl.startsWith('https://')

function deriveCookieDomain(): string | undefined {
  if (!nextAuthUrl) return undefined
  try {
    const host = new URL(nextAuthUrl).hostname
    if (host === 'localhost' || /^[\d.]+$/.test(host)) return undefined
    const parts = host.split('.')
    if (parts.length < 2) return undefined
    return '.' + parts.slice(1).join('.')
  } catch {
    return undefined
  }
}

const cookieDomain = deriveCookieDomain()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
  },
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, status: true },
        })

        session.user.id = user.id
        session.user.role = dbUser?.role ?? 'USER'
        session.user.status = dbUser?.status ?? 'ACTIVE'
      }

      return session
    },
  },
  events: {
    async createUser({ user }) {
      const email = user.email?.toLowerCase()
      if (!email) {
        return
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: adminEmails.includes(email) ? 'ADMIN' : 'USER',
          status: 'ACTIVE',
        },
      })
    },
    async signIn({ user }) {
      const email = user.email?.toLowerCase()

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(email && adminEmails.includes(email) ? { role: 'ADMIN' } : {}),
        },
      })
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export type SessionUser = AppRole & {
  id: string
}
