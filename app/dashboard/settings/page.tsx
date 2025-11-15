'use client'

import { UserGuard } from '@/lib/user-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { UserSettings } from '@/components/user-settings'

export default function SettingsPage() {
  return (
    <UserGuard>
      <DashboardLayout>
        <UserSettings />
      </DashboardLayout>
    </UserGuard>
  )
}
