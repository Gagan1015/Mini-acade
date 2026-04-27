import type { Metadata } from 'next'
import { PrivacyPage } from '@/components/pages/PrivacyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy - Arcado',
  description: 'How Arcado collects, uses, and protects your personal information.',
}

export default function Privacy() {
  return <PrivacyPage />
}
