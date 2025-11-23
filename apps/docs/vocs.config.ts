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
      link: '/',
    },
    {
      text: 'Quickstart',
      link: '/quick-start',
    },
    {
      text: 'Architecture',
      collapsed: false,
      items: nav.navItems('/architecture'),
    },
    {
      text: 'Components',
      collapsed: false,
      items: nav.navItems('/components'),
    },
    {
      text: 'Implementation',
      collapsed: false,
      items: nav.navItems('/implementation'),
    },
    {
      text: 'API Reference',
      collapsed: false,
      items: nav.navItems('/api'),
    },
  ],
})
