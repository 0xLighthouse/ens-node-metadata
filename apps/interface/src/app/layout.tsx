import type { Metadata } from 'next'

import './globals.css'

import localFont from 'next/font/local'

import { Toaster } from '@/components/ui/sonner'
import { getThemeCookie } from '@/lib/nextjs/getThemeCookie'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Web3Provider } from '@/contexts/Web3Provider'
import { SpaceProvider } from '@/contexts/SpaceContext'

import DefaultLayout from './components/layouts/default'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Dispatch',
  description: 'Dispatch by Lighthouse Labs',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Set the tailwind theme from stored cookie preference
  const theme = getThemeCookie()

  return (
    <html lang="en" className={theme}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider initialTheme={theme}>
          <Web3Provider>
            <SpaceProvider>
              <DefaultLayout>{children}</DefaultLayout>
              <Toaster />
            </SpaceProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
