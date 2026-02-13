import { PageBreadcrumbs } from '@/components/page-breadcrumbs'
import { ConnectButton } from '@/components/connect-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AuthGate } from '@/components/auth/auth-gate'
import { DomainGate } from '@/components/auth/domain-gate'
import { DOCS_NAV_URL, SCHEMAS_NAV_URL } from '@/config/constants'
import { colorSystem } from '@/config/theme'
import { BookOpenText, ExternalLink, FileJson } from 'lucide-react'
import { TreeButtonGroup } from '../tree-button-group'

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  const isExternal = (href: string) => href.startsWith('http')

  const getLinkProps = (href: string) =>
    isExternal(href)
      ? {
          target: '_blank',
          rel: 'noreferrer',
        }
      : {}

  const navLinkClasses =
    'inline-flex h-10 items-center justify-center rounded-md bg-transparent px-4 text-sm font-medium hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-neutral-50'

  return (
    <div className="flex min-h-svh flex-col bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center px-4 sm:px-8">
        <div className="flex-1">
          <PageBreadcrumbs />
        </div>

        <div className="flex-shrink-0">
          <TreeButtonGroup />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden lg:flex items-center gap-1">
            <a
              href={DOCS_NAV_URL}
              className={navLinkClasses}
              aria-label={isExternal(DOCS_NAV_URL) ? 'Docs (opens in new tab)' : 'Docs'}
              {...getLinkProps(DOCS_NAV_URL)}
            >
              <BookOpenText className="size-4 mr-2" />
              Docs
              {isExternal(DOCS_NAV_URL) && <ExternalLink className="size-3.5 ml-1 opacity-70" />}
            </a>
            <a
              href={SCHEMAS_NAV_URL}
              className={navLinkClasses}
              aria-label={isExternal(SCHEMAS_NAV_URL) ? 'Schemas (opens in new tab)' : 'Schemas'}
              {...getLinkProps(SCHEMAS_NAV_URL)}
            >
              <FileJson className="size-4 mr-2" />
              Schemas
              {isExternal(SCHEMAS_NAV_URL) && (
                <ExternalLink className="size-3.5 ml-1 opacity-70" />
              )}
            </a>
          </div>
          <ThemeToggle />
          <ConnectButton />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex min-h-0 flex-1 flex-col p-4">
        <section className={`flex min-h-0 flex-1 flex-col rounded-2xl p-0 ${colorSystem.bg.panel}`}>
          <AuthGate>
            <DomainGate>{children}</DomainGate>
          </AuthGate>
        </section>
      </main>
    </div>
  )
}
