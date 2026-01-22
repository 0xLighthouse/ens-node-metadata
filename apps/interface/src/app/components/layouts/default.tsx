import { PageBreadcrumbs } from '@/components/page-breadcrumbs'
import { ConnectButton } from '@/components/connect-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AuthGate } from '@/components/auth/auth-gate'
import { DomainGate } from '@/components/auth/domain-gate'
import { colorSystem } from '@/config/theme'
import { TreeButtonGroup } from '../tree-button-group'

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
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
