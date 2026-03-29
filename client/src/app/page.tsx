import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LandingPage } from '@/components/pages/LandingPage'

export default async function Home() {
  const session = await getServerSession(authOptions)
  const isSignedIn = Boolean(session?.user)

  return (
    <LandingPage
      isSignedIn={isSignedIn}
      userName={session?.user?.name ?? undefined}
      userImage={session?.user?.image ?? undefined}
      userRole={(session?.user as { role?: string })?.role}
    />
  )
}
