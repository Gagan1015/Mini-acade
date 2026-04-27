'use client'

import { motion } from 'motion/react'
import { AppLayout } from '@/components/layout/AppLayout'

const lastUpdated = 'April 24, 2026'

const sections = [
  {
    title: 'Acceptance of Terms',
    content: [
      'By accessing or using Arcado, you agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use the platform.',
      'We reserve the right to update these terms at any time. Continued use after changes are posted constitutes acceptance of the revised terms.',
    ],
  },
  {
    title: 'Account & Authentication',
    content: [
      'You sign in to Arcado using a third-party OAuth provider. You are responsible for maintaining the security of your provider account and any activity that occurs under your session.',
      'You must provide accurate information during sign-in. We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior.',
    ],
  },
  {
    title: 'Acceptable Use',
    content: [
      'You agree to use Arcado only for lawful purposes. You must not use the platform to harass, abuse, or threaten other users, transmit harmful or offensive content, or attempt to disrupt the service.',
      'In-game content you create (such as drawings in Skribble or chat messages) must not contain hate speech, explicit material, or content that violates the rights of others.',
      'We reserve the right to remove content and restrict access to users who violate these guidelines without prior notice.',
    ],
  },
  {
    title: 'Game Rooms & Multiplayer',
    content: [
      'Game rooms are temporary sessions. Room data including chat messages, drawings, and game state is ephemeral and automatically deleted when the room closes.',
      'Room creators can set rules and manage participants within their rooms. All participants must respect room settings and the experience of other players.',
    ],
  },
  {
    title: 'Intellectual Property',
    content: [
      'Arcado, including its design, code, graphics, and game mechanics, is protected by intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the platform.',
      'Content you create during gameplay (drawings, messages) is yours, but you grant Arcado a limited license to display it within the context of the game session.',
    ],
  },
  {
    title: 'Availability & Warranties',
    content: [
      'Arcado is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or available at all times.',
      'We may modify, suspend, or discontinue any part of the service at any time without liability.',
    ],
  },
  {
    title: 'Limitation of Liability',
    content: [
      'To the maximum extent permitted by law, Arcado and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.',
      'This includes, but is not limited to, loss of data, loss of profits, or damages resulting from service interruptions.',
    ],
  },
  {
    title: 'Termination',
    content: [
      'We may terminate or suspend your access to Arcado at our discretion, without prior notice, for conduct that we believe violates these terms or is harmful to other users or the platform.',
      'Upon termination, your right to use the service ceases immediately. Provisions that by their nature should survive termination will remain in effect.',
    ],
  },
  {
    title: 'Governing Law',
    content: [
      'These terms are governed by and construed in accordance with applicable laws. Any disputes arising from these terms or your use of Arcado will be resolved through appropriate legal channels.',
    ],
  },
]

export function TermsPage() {
  return (
    <AppLayout variant="marketing">
      <div className="marketing-rail-layout overflow-hidden bg-[var(--background)]">
        <section className="marketing-rail-section border-b border-[var(--marketing-hairline)]">
          <div className="mx-auto max-w-3xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
                Legal
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Terms of Service
              </h1>
              <p className="mt-4 text-sm text-[var(--text-tertiary)]">
                Last updated: {lastUpdated}
              </p>
              <p className="mt-6 text-base leading-7 text-[var(--text-secondary)]">
                These terms govern your use of Arcado. By playing, you agree to the rules
                below -- they keep the experience fair and fun for everyone.
              </p>
            </motion.div>

            <div className="mt-14 space-y-12">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}
                >
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {section.content.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className="text-sm leading-7 text-[var(--text-secondary)]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
