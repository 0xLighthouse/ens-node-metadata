import type { Metadata } from 'next'

import './page.css'

import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Web3Provider } from '@/contexts/Web3Provider'
import { getThemeCookie } from '@/lib/nextjs/getThemeCookie'

import { RouteTracker } from './components/RouteTracker'
import DefaultLayout from './components/layouts/default'

export const metadata: Metadata = {
  title: 'ENS Org Metadata',
  description: 'ENS Org Metadata by Lighthouse Labs',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Set the tailwind theme from stored cookie preference
  const theme = await getThemeCookie()

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
