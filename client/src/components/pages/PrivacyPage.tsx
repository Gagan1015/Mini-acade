'use client'

import { motion } from 'motion/react'
import { AppLayout } from '@/components/layout/AppLayout'

const lastUpdated = 'April 24, 2026'

const sections = [
  {
    title: 'Information We Collect',
    content: [
      'When you sign in through a third-party provider (such as Google or GitHub), we receive your display name, email address, and profile picture. We do not access your provider password.',
      'We automatically collect basic usage data such as pages visited, game sessions played, and general device information (browser type, screen size) to improve the experience.',
    ],
  },
  {
    title: 'How We Use Your Information',
    content: [
      'We use the information we collect to operate and maintain your account, display your profile in game rooms, track scores and statistics, and improve Arcado.',
      'We do not sell, rent, or share your personal information with third parties for marketing purposes.',
    ],
  },
  {
    title: 'Data Storage & Security',
    content: [
      'Your data is stored securely using industry-standard encryption. Game room data (chat messages, drawings, guesses) is ephemeral and automatically deleted when a room closes.',
      'While we take reasonable precautions to protect your information, no method of electronic storage is 100% secure. We cannot guarantee absolute security.',
    ],
  },
  {
    title: 'Cookies & Local Storage',
    content: [
      'We use cookies and browser local storage to maintain your session, remember your theme preference, and keep you signed in across visits.',
      'These are essential for the application to function and are not used for advertising or tracking across other websites.',
    ],
  },
  {
    title: 'Third-Party Services',
    content: [
      'Arcado relies on third-party authentication providers (OAuth) for sign-in. These providers have their own privacy policies that govern how they handle your data.',
      'We do not embed third-party analytics or advertising scripts.',
    ],
  },
  {
    title: 'Your Rights',
    content: [
      'You may request deletion of your account and associated data at any time by contacting us. Upon deletion, your profile, statistics, and session history will be permanently removed.',
      'You can update your display name and profile information from your profile settings page.',
    ],
  },
  {
    title: 'Children\'s Privacy',
    content: [
      'Arcado is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal data, we will take steps to delete it.',
    ],
  },
  {
    title: 'Changes to This Policy',
    content: [
      'We may update this privacy policy from time to time. When we do, we will revise the "last updated" date at the top of this page. Continued use of Arcado after changes constitutes acceptance of the updated policy.',
    ],
  },
]

export function PrivacyPage() {
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
                Privacy Policy
              </h1>
              <p className="mt-4 text-sm text-[var(--text-tertiary)]">
                Last updated: {lastUpdated}
              </p>
              <p className="mt-6 text-base leading-7 text-[var(--text-secondary)]">
                Arcado is built to be fun and respectful of your privacy. This policy explains
                what data we collect, why we collect it, and how we handle it.
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
