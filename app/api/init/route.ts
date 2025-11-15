import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initializeDatabase()
    return NextResponse.json({ success: true, message: '数据库初始化成功' })
  } catch (error: any) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { success: false, message: '数据库初始化失败', error: error.message },
      { status: 500 }
    )
  }
}
