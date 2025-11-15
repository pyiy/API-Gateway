import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET all stations for current user
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
    const [stations] = await db.execute(
      'SELECT * FROM api_stations WHERE user_id = ? ORDER BY created_at DESC',
      [session.userId]
    ) as any[]

    return NextResponse.json({
      success: true,
      stations,
    })
  } catch (error: any) {
    console.error('Get stations error:', error)
    return NextResponse.json(
      { success: false, message: '获取API站点失败', error: error.message },
      { status: 500 }
    )
  }
}

// POST create new station
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      base_url,
      api_key,
      models_endpoint = '/v1/models',
      chat_endpoint = '/v1/chat/completions',
      default_test_question = 'who are u?',
      default_stream = true,
      default_timeout = 12,
      default_concurrency = 3,
    } = body

    if (!name || !base_url || !api_key) {
      return NextResponse.json(
        { success: false, message: '名称、基础地址和API Key不能为空' },
        { status: 400 }
      )
    }

    const db = getDB()
    const [result] = await db.execute(
      `INSERT INTO api_stations (
        user_id, name, base_url, api_key, models_endpoint, chat_endpoint,
        default_test_question, default_stream, default_timeout, default_concurrency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.userId, name, base_url, api_key, models_endpoint, chat_endpoint,
        default_test_question, default_stream, default_timeout, default_concurrency
      ]
    ) as any[]

    return NextResponse.json({
      success: true,
      message: '创建成功',
      stationId: (result as any).insertId,
    })
  } catch (error: any) {
    console.error('Create station error:', error)
    return NextResponse.json(
      { success: false, message: '创建失败', error: error.message },
      { status: 500 }
    )
  }
}
