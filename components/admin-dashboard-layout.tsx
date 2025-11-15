'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { LogOut, LayoutDashboard, Users, Settings, Shield, Home } from 'lucide-react'
import Link from 'next/link'

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '成功',
          description: '已退出登录',
        })
        router.push('/admin/login')
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '退出登录失败',
        variant: 'destructive',
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <nav className="flex items-center gap-2 md:gap-4 flex-wrap">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">控制面板</span>
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">用户管理</span>
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">系统设置</span>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">用户系统</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">退出登录</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
