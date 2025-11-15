'use client'

import { UserGuard } from '@/lib/user-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { UserDashboard } from '@/components/user-dashboard'

export default function DashboardPage() {
  return (
    <UserGuard>
      <DashboardLayout>
        <UserDashboard />
      </DashboardLayout>
    </UserGuard>
  )
}
