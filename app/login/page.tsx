'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Captcha } from '@/components/captcha'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [captchaValid, setCaptchaValid] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        
        if (data.success && data.user) {
          router.push('/dashboard')
        }
      } catch (error) {
        // Not logged in, stay on page
      }
    }
    
    checkAuth()
  }, [router])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/public-settings')
        const data = await response.json()
        
        console.log('[AI API Manager] Login captcha settings:', data)
        
        if (data.success) {
          const captchaEnabled = data.settings.enable_login_captcha === 'true' || data.settings.enable_login_captcha === '1'
          console.log('[AI API Manager] Should show captcha:', captchaEnabled)
          setShowCaptcha(captchaEnabled)
        }
      } catch (error) {
        console.error('[AI API Manager] Failed to load settings:', error)
      } finally {
        setSettingsLoaded(true)
      }
    }
    
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (showCaptcha && !captchaValid) {
      toast({
        title: '错误',
        description: '验证码错误',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          ...(showCaptcha && { captcha, captchaAnswer })
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '成功',
          description: '登录成功',
        })
        router.push('/dashboard')
      } else {
        toast({
          title: '登录失败',
          description: data.message || '用户名或密码错误',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">加载中...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">用户登录</CardTitle>
          <CardDescription className="text-center">登录到您的账户</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {showCaptcha && (
              <Captcha
                value={captcha}
                onChange={setCaptcha}
                onValidate={setCaptchaValid}
                onAnswerChange={setCaptchaAnswer}
              />
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              还没有账户？{' '}
              <Link href="/register" className="text-primary hover:underline">
                立即注册
              </Link>
            </div>
            <Link href="/" className="text-sm text-center text-muted-foreground hover:underline">
              返回首页
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
