import { AppSidebar } from '../nav/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { PageBreadcrumbs } from '@/components/page-breadcrumbs'
import { Auth } from '@/components/connect-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AuthGate } from '@/components/auth/auth-gate'
import { SpaceGate } from '@/components/auth/space-gate'

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <PageBreadcrumbs />
          </div>
          <div className="flex items-center gap-2 pr-4">
            <ThemeToggle />
            <Auth />
          </div>
        </header>

        <AuthGate>
          <SpaceGate>{children}</SpaceGate>
        </AuthGate>
      </SidebarInset>
    </SidebarProvider>
  )
}
