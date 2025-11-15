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
    const modelsUrl = `${station.base_url}${station.models_endpoint}`

    // Fetch models from API
    const response = await fetch(modelsUrl, {
      headers: {
        'Authorization': `Bearer ${station.api_key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: '获取模型列表失败',
        valid: false,
      })
    }

    const data = await response.json()
    const models = data.data?.map((model: any) => model.id) || []

    return NextResponse.json({
      success: true,
      valid: true,
      models,
      count: models.length,
    })
  } catch (error: any) {
    console.error('Get models error:', error)
    return NextResponse.json({
      success: false,
      message: '获取模型列表失败',
      error: error.message,
      valid: false,
    })
  }
}
