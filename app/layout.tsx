import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import TabTitle from '@/components/tab-title'
import CommandPalette from '@/components/command-palette'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeEntranceReplayProvider } from '@/components/theme-entrance-replay'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://ayaanfaisal.com'),
  title: 'ayaanfaisal.com 🐐',
  description:
    'Ayaan Faisal is an undergraduate Math/CS student at the University of Waterloo seeking co-op internships. This is his personal portfolio of projects and experiments.',
  generator: 'v0.app',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://ayaanfaisal.com',
    title: 'Ayaan Faisal | you can just build things...',
    description:
      'Personal portfolio of Ayaan Faisal, an undergraduate Math/CS student at the University of Waterloo seeking co-op opportunities.',
    siteName: 'Ayaan Faisal',
    images: [
      {
        url: '/images/logo-tab.png',
        width: 512,
        height: 512,
        alt: 'Ayaan Faisal logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Ayaan Faisal | you can just build things...',
    description:
      'Personal portfolio of Ayaan Faisal, an undergraduate Math/CS student at the University of Waterloo seeking co-op opportunities.',
    images: ['/images/logo-tab.png'],
  },
  icons: {
    icon: [
      { url: '/images/logo-tab.png', type: 'image/png' },
      { url: '/images/logo-tab.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo-tab.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/images/logo-tab.png',
    apple: '/images/logo-tab.png',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeEntranceReplayProvider>
            <TabTitle />
            {children}
            <CommandPalette />
            <Analytics />
          </ThemeEntranceReplayProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
