import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// GET single station
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

    return NextResponse.json({
      success: true,
      station: stations[0],
    })
  } catch (error: any) {
    console.error('Get station error:', error)
    return NextResponse.json(
      { success: false, message: '获取失败', error: error.message },
      { status: 500 }
    )
  }
}

// PUT update station
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const {
      name,
      base_url,
      api_key,
      models_endpoint,
      chat_endpoint,
      default_test_question,
      default_stream,
      default_timeout,
      default_concurrency,
    } = body

    const db = getDB()
    await db.execute(
      `UPDATE api_stations SET
        name = ?, base_url = ?, api_key = ?, models_endpoint = ?,
        chat_endpoint = ?, default_test_question = ?, default_stream = ?,
        default_timeout = ?, default_concurrency = ?
      WHERE id = ? AND user_id = ?`,
      [
        name, base_url, api_key, models_endpoint, chat_endpoint,
        default_test_question, default_stream, default_timeout, default_concurrency,
        id, session.userId
      ]
    )

    return NextResponse.json({
      success: true,
      message: '更新成功',
    })
  } catch (error: any) {
    console.error('Update station error:', error)
    return NextResponse.json(
      { success: false, message: '更新失败', error: error.message },
      { status: 500 }
    )
  }
}

// DELETE station
export async function DELETE(request: NextRequest, context: RouteContext) {
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
    await db.execute(
      'DELETE FROM api_stations WHERE id = ? AND user_id = ?',
      [id, session.userId]
    )

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error: any) {
    console.error('Delete station error:', error)
    return NextResponse.json(
      { success: false, message: '删除失败', error: error.message },
      { status: 500 }
    )
  }
}
