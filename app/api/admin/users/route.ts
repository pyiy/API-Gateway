import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET all users
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const db = getDB()
    let query = 'SELECT id, username, is_admin, is_active, created_at FROM users'
    const params: any[] = []

    if (search) {
      query += ' WHERE username LIKE ?'
      params.push(`%${search}%`)
    }

    query += ' ORDER BY created_at DESC'

    const [users] = await db.execute(query, params) as any[]

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, message: '获取用户列表失败', error: error.message },
      { status: 500 }
    )
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { username, password, is_admin } = await request.json()

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
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
      [username, hashedPassword, is_admin || false]
    )

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, message: '创建用户失败', error: error.message },
      { status: 500 }
    )
  }
}
