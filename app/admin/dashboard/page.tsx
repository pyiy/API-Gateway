'use client'

import { AdminGuard } from '@/lib/admin-guard'
import { AdminDashboardLayout } from '@/components/admin-dashboard-layout'
import { AdminDashboard } from '@/components/admin-dashboard'

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboardLayout>
        <AdminDashboard />
      </AdminDashboardLayout>
    </AdminGuard>
  )
}
