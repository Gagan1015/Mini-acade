import type { Metadata } from 'next'
import { TermsPage } from '@/components/pages/TermsPage'

export const metadata: Metadata = {
  title: 'Terms of Service - Arcado',
  description: 'Terms and conditions for using Arcado.',
}

export default function Terms() {
  return <TermsPage />
}
