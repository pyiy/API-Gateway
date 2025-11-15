import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'
import { getSession, createSession } from '@/lib/auth'

// GET user profile
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
    const [users] = await db.execute(
      'SELECT id, username, created_at FROM users WHERE id = ?',
      [session.userId]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: users[0],
    })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, message: '获取用户信息失败', error: error.message },
      { status: 500 }
    )
  }
}

// PUT update user profile
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
    const { username, currentPassword, newPassword } = body

    const db = getDB()

    // Get current user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [session.userId]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    const user = users[0]

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: '请输入当前密码' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, message: '当前密码错误' },
          { status: 401 }
        )
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, session.userId]
      )
    }

    // Update username if changed
    if (username && username !== user.username) {
      // Check if username already exists
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, session.userId]
      ) as any[]

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { success: false, message: '用户名已存在' },
          { status: 409 }
        )
      }

      await db.execute(
        'UPDATE users SET username = ? WHERE id = ?',
        [username, session.userId]
      )

      // Update session with new username
      await createSession({
        userId: session.userId,
        username: username,
        isAdmin: session.isAdmin,
      })
    }

    return NextResponse.json({
      success: true,
      message: '更新成功',
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, message: '更新失败', error: error.message },
      { status: 500 }
    )
  }
}
