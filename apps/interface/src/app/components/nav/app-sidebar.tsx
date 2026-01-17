'use client'

import * as React from 'react'
import Link from 'next/link'
import { BookOpen, Coins, ShipWheel, Users, FileText, Settings } from 'lucide-react'

import { NavGroup } from './nav-primary'
import { NavSecondary } from './nav-secondary'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { HomeLogo } from '@/components/ui/home-logo'

const data = {
  navPlatform: [
    {
      name: 'Dashboard',
      url: '/admin/dashboard',
      icon: Coins,
    },
    {
      name: 'Campaigns',
      url: '/admin/campaigns',
      icon: ShipWheel,
    },
    {
      name: 'Audience',
      url: '/admin/audience',
      icon: Users,
    },
    {
      name: 'Topics',
      url: '/admin/topics',
      icon: FileText,
    },
    {
      name: 'Settings',
      url: '/admin/settings',
      icon: Settings,
    },
  ],
  navFaucets: [
    {
      name: 'Superfluid (🔜)',
      url: '#',
      icon: BookOpen,
    },
  ],
  navSecondary: [
    {
      title: 'Documentation',
      url: 'https://harbor.docs.lighthouse.cx',
      icon: BookOpen,
      isExternal: true,
    },
    {
      title: 'Mirror',
      url: 'https://mirror.xyz/lighthousegov.eth',
      icon: BookOpen,
      isExternal: true,
    },
    // {
    //   title: 'Support',
    //   url: '#',
    //   icon: LifeBuoy,
    // },
    // {
    //   title: 'Feedback',
    //   url: '#',
    //   icon: Send,
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <HomeLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup items={data.navPlatform} title="Platform" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
