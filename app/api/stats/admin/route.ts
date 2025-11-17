export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const db = getDB()

    // Get total users
    const [totalUsers] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = FALSE'
    ) as any[]

    // Get total admins
    const [totalAdmins] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = TRUE'
    ) as any[]

    // Get total API stations
    const [totalStations] = await db.execute(
      'SELECT COUNT(*) as count FROM api_stations'
    ) as any[]

    // Get active users
    const [activeUsers] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = FALSE AND is_active = TRUE'
    ) as any[]

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers[0].count,
        totalAdmins: totalAdmins[0].count,
        totalStations: totalStations[0].count,
        activeUsers: activeUsers[0].count,
      },
    })
  } catch (error: any) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { success: false, message: '获取统计信息失败', error: error.message },
      { status: 500 }
    )
  }
}
