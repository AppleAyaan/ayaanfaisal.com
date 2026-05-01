import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import TabTitle from '@/components/tab-title'
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
    title: 'Ayaan Faisal - Waterloo Math/CS Student',
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
    title: 'Ayaan Faisal - Waterloo Math/CS Student',
    description:
      'Personal portfolio of Ayaan Faisal, an undergraduate Math/CS student at the University of Waterloo seeking co-op opportunities.',
    images: ['/images/logo-tab.png'],
  },
  icons: {
    icon: '/images/logo-tab.png',
    apple: '/images/logo.png',
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
    <html lang="en">
      <body className="font-sans antialiased">
        <TabTitle />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
