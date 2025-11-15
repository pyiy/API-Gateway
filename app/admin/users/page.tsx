'use client'

import { AdminGuard } from '@/lib/admin-guard'
import { AdminDashboardLayout } from '@/components/admin-dashboard-layout'
import { UserManagement } from '@/components/user-management'

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminDashboardLayout>
        <UserManagement />
      </AdminDashboardLayout>
    </AdminGuard>
  )
}
