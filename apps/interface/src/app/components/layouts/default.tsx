import { PageBreadcrumbs } from '@/components/page-breadcrumbs'
import { Auth } from '@/components/connect-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AuthGate } from '@/components/auth/auth-gate'
import { DomainGate } from '@/components/auth/domain-gate'
import { colorSystem } from '@/config/theme'

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-8">
        <PageBreadcrumbs />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Auth />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col p-4">
        <section
          className={`flex min-h-0 flex-1 flex-col rounded-2xl p-3 sm:p-4 ${colorSystem.bg.panel}`}
        >
          <AuthGate>
            <DomainGate>{children}</DomainGate>
          </AuthGate>
        </section>
      </main>
    </div>
  )
}
