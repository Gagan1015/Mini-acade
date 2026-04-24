import type { Metadata } from 'next'
import { TermsPage } from '@/components/pages/TermsPage'

export const metadata: Metadata = {
  title: 'Terms of Service — Mini Arcade',
  description: 'Terms and conditions for using Mini Arcade.',
}

export default function Terms() {
  return <TermsPage />
}
