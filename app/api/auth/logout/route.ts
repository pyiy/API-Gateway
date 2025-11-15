import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST() {
  try {
    await deleteSession()
    return NextResponse.json({
      success: true,
      message: '退出登录成功',
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: '退出登录失败', error: error.message },
      { status: 500 }
    )
  }
}
