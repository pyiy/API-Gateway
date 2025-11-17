export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const db = getDB()

    // Get total stations
    const [totalStations] = await db.execute(
      'SELECT COUNT(*) as count FROM api_stations WHERE user_id = ?',
      [session.userId]
    ) as any[]

    // Get all stations for validity check
    const [stations] = await db.execute(
      'SELECT id, base_url, api_key, models_endpoint FROM api_stations WHERE user_id = ?',
      [session.userId]
    ) as any[]

    // Check validity of each station
    let validCount = 0
    let invalidCount = 0

    for (const station of stations) {
      try {
        const modelsUrl = `${station.base_url}${station.models_endpoint}`
        const response = await fetch(modelsUrl, {
          headers: {
            'Authorization': `Bearer ${station.api_key}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          validCount++
        } else {
          invalidCount++
        }
      } catch (error) {
        invalidCount++
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalStations: totalStations[0].count,
        validStations: validCount,
        invalidStations: invalidCount,
      },
    })
  } catch (error: any) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { success: false, message: '获取统计信息失败', error: error.message },
      { status: 500 }
    )
  }
}
