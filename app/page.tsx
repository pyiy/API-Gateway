'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [initStatus, setInitStatus] = useState<{ success?: boolean; message?: string }>({})

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const response = await fetch('/api/init')
        const data = await response.json()
        setInitStatus(data)
      } catch (error) {
        setInitStatus({ success: false, message: '系统初始化失败' })
      } finally {
        setIsInitializing(false)
      }
    }

    const checkAuthAndRedirect = async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()

        if (data.success && data.user) {
          if (data.user.isAdmin) {
            router.push('/admin/dashboard')
          } else {
            router.push('/dashboard')
          }
        }
      } catch (error) {
        // User not logged in, continue to home page
      }
    }

    initializeSystem().then(() => {
      checkAuthAndRedirect()
    })
  }, [router])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">系统初始化中...</CardTitle>
            <CardDescription className="text-center">请稍候</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">AI API 中转站管理系统</CardTitle>
          <CardDescription className="mt-2">
            {initStatus.success ? '系统已就绪' : initStatus.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => router.push('/login')}
          >
            用户登录
          </Button>
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => router.push('/admin/login')}
          >
            管理员登录
          </Button>
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => router.push('/register')}
          >
            用户注册
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
