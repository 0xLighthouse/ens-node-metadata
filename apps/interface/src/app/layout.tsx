import type { Metadata } from 'next'

import './page.css'

import { Toaster } from '@/components/ui/sonner'
import { getThemeCookie } from '@/lib/nextjs/getThemeCookie'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Web3Provider } from '@/contexts/Web3Provider'

import DefaultLayout from './components/layouts/default'
import { RouteTracker } from './components/RouteTracker'

export const metadata: Metadata = {
  title: 'ENS Org Metadata',
  description: 'ENS Org Metadata by Lighthouse Labs',
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
      <body>
        <RouteTracker />
        <ThemeProvider initialTheme={theme}>
          <Web3Provider>
            <DefaultLayout>{children}</DefaultLayout>
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
