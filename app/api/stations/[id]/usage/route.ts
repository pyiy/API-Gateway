import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const db = getDB()
    const [stations] = await db.execute(
      'SELECT * FROM api_stations WHERE id = ? AND user_id = ?',
      [id, session.userId]
    ) as any[]

    if (stations.length === 0) {
      return NextResponse.json(
        { success: false, message: 'API站点不存在' },
        { status: 404 }
      )
    }

    const station = stations[0]
    const usageUrl = `${station.base_url}/api/usage/token`

    // Fetch usage info from API
    const response = await fetch(usageUrl, {
      headers: {
        'Authorization': `Bearer ${station.api_key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: '额度查询失败或不支持额度查询',
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      usage: data.data,
    })
  } catch (error: any) {
    console.error('Get usage error:', error)
    return NextResponse.json({
      success: false,
      message: '额度查询失败或不支持额度查询',
    })
  }
}
