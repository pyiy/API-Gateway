import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const db = getDB()
    const [settings] = await db.execute(
      'SELECT * FROM system_settings'
    ) as any[]

    const settingsObj: any = {}
    settings.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value
    })

    return NextResponse.json({
      success: true,
      settings: settingsObj,
    })
  } catch (error: any) {
    console.error('Get system settings error:', error)
    return NextResponse.json(
      { success: false, message: '获取系统设置失败', error: error.message },
      { status: 500 }
    )
  }
}

// PUT update system settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const settings = await request.json()

    const db = getDB()

    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      )
    }

    return NextResponse.json({
      success: true,
      message: '系统设置保存成功',
    })
  } catch (error: any) {
    console.error('Update system settings error:', error)
    return NextResponse.json(
      { success: false, message: '保存系统设置失败', error: error.message },
      { status: 500 }
    )
  }
}
