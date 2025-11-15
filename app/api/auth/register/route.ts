import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username, password, captcha, captchaAnswer } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { success: false, message: '用户名长度应在3-50个字符之间' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度至少为6个字符' },
        { status: 400 }
      )
    }

    const db = getDB()

    // Check if registration is enabled
    const [settings] = await db.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['enable_registration']
    ) as any[]

    if (settings[0]?.setting_value !== 'true') {
      return NextResponse.json(
        { success: false, message: '注册功能已关闭' },
        { status: 403 }
      )
    }

    const [regCaptchaSettings] = await db.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['enable_reg_captcha']
    ) as any[]

    if (regCaptchaSettings[0]?.setting_value === '1') {
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

    // Check if username already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    ) as any[]

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10)
    await db.execute(
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, FALSE)',
      [username, hashedPassword]
    )

    // Get the created user
    const [users] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    ) as any[]

    const userId = users[0].id

    // Create default user settings
    const defaultChatApps = [
  {
    "ChatGPT Next Web": "https://n3xt.chat/#/?settings={\"key\":\"{key}\",\"url\":\"{address}\"}"
  },
  {
    "ChatWeb": "https://vercel.ddaiai.com/#/s/t?OPENAI_API_BASE_URL={address}&OPENAI_API_KEY={key}&MJ_SERVER={address}&MJ_API_SECRET={key}&UPLOADER_URL="
  },
  {
    "Lobe Chat": "https://chat-preview.lobehub.com/?settings={\"keyVaults\":{\"openai\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\"}}}"
  },
  {
    "AI as Workspace": "https://aiaw.app/set-provider?provider={\"type\":\"openai\",\"settings\":{\"apiKey\":\"{key}\",\"baseURL\":\"{address}/v1\",\"compatibility\":\"strict\"}}"
  },
  {
    "AICheck": "https://check.crond.dev/?settings={\"key\":\"{key}\",\"url\":\"{address}\",\"models\":[\"{model}\"],\"timeout\":10,\"concurrency\":2,\"closeAnnouncement\":true,\"closeChat\":true}"
  },
  {
    "AMA 问天": "ama://set-api-key?server={address}&key={key}"
  },
  {
    "OpenCat": "opencat://team/join?domain={address}&token={key}"
  }
  ]

    await db.execute(
      'INSERT INTO user_settings (user_id, chat_apps) VALUES (?, ?)',
      [userId, JSON.stringify(defaultChatApps)]
    )

    return NextResponse.json({
      success: true,
      message: '注册成功',
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: '注册失败', error: error.message },
      { status: 500 }
    )
  }
}
