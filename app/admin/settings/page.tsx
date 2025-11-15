'use client'

import { AdminGuard } from '@/lib/admin-guard'
import { AdminDashboardLayout } from '@/components/admin-dashboard-layout'
import { SystemSettings } from '@/components/system-settings'

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <AdminDashboardLayout>
        <SystemSettings />
      </AdminDashboardLayout>
    </AdminGuard>
  )
}
