export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET user settings
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
    const [settings] = await db.execute(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [session.userId]
    ) as any[]

    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        settings: {
          chat_apps: [],
          models_endpoint: '/v1/models',
          chat_endpoint: '/v1/chat/completions',
          default_test_question: 'who are u?',
          default_stream: true,
          default_timeout: 12,
          default_concurrency: 3,
        },
      })
    }

    const userSettings = settings[0]
    return NextResponse.json({
      success: true,
      settings: {
        ...userSettings,
        chat_apps: typeof userSettings.chat_apps === 'string'
          ? JSON.parse(userSettings.chat_apps)
          : userSettings.chat_apps,
      },
    })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { success: false, message: '获取设置失败', error: error.message },
      { status: 500 }
    )
  }
}

// PUT update user settings
export async function PUT(request: NextRequest) {
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
      chat_apps,
      models_endpoint,
      chat_endpoint,
      default_test_question,
      default_stream,
      default_timeout,
      default_concurrency,
    } = body

    const db = getDB()

    // Check if settings exist
    const [existing] = await db.execute(
      'SELECT id FROM user_settings WHERE user_id = ?',
      [session.userId]
    ) as any[]

    const chatAppsJson = JSON.stringify(chat_apps)

    if (existing.length === 0) {
      // Insert new settings
      await db.execute(
        `INSERT INTO user_settings (
          user_id, chat_apps, models_endpoint, chat_endpoint,
          default_test_question, default_stream, default_timeout, default_concurrency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.userId, chatAppsJson, models_endpoint, chat_endpoint,
          default_test_question, default_stream, default_timeout, default_concurrency
        ]
      )
    } else {
      // Update existing settings
      await db.execute(
        `UPDATE user_settings SET
          chat_apps = ?, models_endpoint = ?, chat_endpoint = ?,
          default_test_question = ?, default_stream = ?,
          default_timeout = ?, default_concurrency = ?
        WHERE user_id = ?`,
        [
          chatAppsJson, models_endpoint, chat_endpoint,
          default_test_question, default_stream, default_timeout, default_concurrency,
          session.userId
        ]
      )
    }

    return NextResponse.json({
      success: true,
      message: '设置保存成功',
    })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { success: false, message: '保存设置失败', error: error.message },
      { status: 500 }
    )
  }
}
