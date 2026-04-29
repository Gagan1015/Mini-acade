import type { Metadata } from 'next'
import { PrivacyPage } from '@/components/pages/PrivacyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Arcado collects, uses, and protects your personal information.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Arcado',
    description: 'How Arcado collects, uses, and protects your personal information.',
    url: '/privacy',
  },
}

export default function Privacy() {
  return <PrivacyPage />
}

