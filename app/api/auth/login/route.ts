import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password, captcha, captchaAnswer } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    const db = getDB()

    // Check if login is enabled
    const [settings] = await db.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['enable_login']
    ) as any[]

    if (settings[0]?.setting_value !== 'true') {
      return NextResponse.json(
        { success: false, message: '登录功能已关闭' },
        { status: 403 }
      )
    }

    const [captchaSettings] = await db.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['enable_captcha']
    ) as any[]

    if (captchaSettings[0]?.setting_value === '1') {
      if (!captcha || !captchaAnswer) {
        return NextResponse.json(
          { success: false, message: '请输入验证码' },
          { status: 400 }
        )
      }

      if (parseInt(captcha) !== parseInt(captchaAnswer)) {
        return NextResponse.json(
          { success: false, message: '验证码错误' },
          { status: 400 }
        )
      }
    }

    const [users] = await db.execute(
      'SELECT id, username, password, is_admin, is_active FROM users WHERE username = ?',
      [username]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    const user = users[0]

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, message: '账户已被禁用' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    await createSession({
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin,
    })

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: '登录失败', error: error.message },
      { status: 500 }
    )
  }
}
