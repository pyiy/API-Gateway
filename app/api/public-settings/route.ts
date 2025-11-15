import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET() {
  try {
    const db = getDB()
    const [rows] = await db.execute(
      'SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?, ?)',
      ['enable_register_captcha', 'enable_login_captcha']
    ) as any[]

    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error: any) {
    console.error('Get public settings error:', error)
    return NextResponse.json(
      { success: false, message: '获取设置失败', error: error.message },
      { status: 500 }
    )
  }
}
