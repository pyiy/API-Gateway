import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET all admins
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const db = getDB()
    const [admins] = await db.execute(
      'SELECT id, username, is_active, created_at FROM users WHERE is_admin = TRUE ORDER BY created_at DESC'
    ) as any[]

    return NextResponse.json({
      success: true,
      admins,
    })
  } catch (error: any) {
    console.error('Get admins error:', error)
    return NextResponse.json(
      { success: false, message: '获取管理员列表失败', error: error.message },
      { status: 500 }
    )
  }
}

// POST create new admin
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    const db = getDB()

    // Check if username exists
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

    const hashedPassword = await bcrypt.hash(password, 10)
    await db.execute(
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, TRUE)',
      [username, hashedPassword]
    )

    return NextResponse.json({
      success: true,
      message: '管理员创建成功',
    })
  } catch (error: any) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { success: false, message: '创建管理员失败', error: error.message },
      { status: 500 }
    )
  }
}
