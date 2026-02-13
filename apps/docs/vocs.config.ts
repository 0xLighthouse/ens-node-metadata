import { defineConfig } from 'vocs'
import { navGenerator } from './lib/navgen'

// Usage: pass a subdirectory (within docs/pages) to the navGenerator to generate links for all files in that directory
const nav = new navGenerator(__dirname)

export default defineConfig({
  aiCta: false,
  title: 'ENS Organizational Registry',
  description: 'ENS-based organizational identity and metadata registry protocol',
  logoUrl: '/logo.png',
  iconUrl: '/favicon.ico',
  rootDir: '.',
  sidebar: [
    {
      text: 'Introduction',
      collapsed: false,
      items: nav.navItems('/introduction'),
    },
    {
      text: 'Architecture',
      collapsed: false,
      items: nav.navItems('/architecture'),
    },
    {
      text: 'Schemas',
      collapsed: false,
      items: nav.navItems('/schemas'),
    },
    {
      text: 'Use cases',
      collapsed: false,
      items: nav.navItems('/use-cases'),
    },
  ],
})
