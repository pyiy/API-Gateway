import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: session,
    })
  } catch (error: any) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { success: false, message: '获取用户信息失败', error: error.message },
      { status: 500 }
    )
  }
}
