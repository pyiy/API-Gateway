import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// PUT update user
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const { username, password, is_active, is_admin } = await request.json()

    const db = getDB()

    // Check if username is taken by another user
    if (username) {
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      ) as any[]

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { success: false, message: '用户名已存在' },
          { status: 409 }
        )
      }
    }

    // Build update query
    const updates: string[] = []
    const params: any[] = []

    if (username) {
      updates.push('username = ?')
      params.push(username)
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.push('password = ?')
      params.push(hashedPassword)
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(is_active)
    }

    if (is_admin !== undefined) {
      updates.push('is_admin = ?')
      params.push(is_admin)
    }

    if (updates.length > 0) {
      params.push(id)
      await db.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      )
    }

    return NextResponse.json({
      success: true,
      message: '用户更新成功',
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, message: '更新用户失败', error: error.message },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const db = getDB()

    await db.execute('DELETE FROM users WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, message: '删除用户失败', error: error.message },
      { status: 500 }
    )
  }
}
