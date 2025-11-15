'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SystemSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    enable_registration: 'true',
    enable_login: 'true',
    enable_register_captcha: 'false',
    enable_login_captcha: 'false',
    system_name: 'AI API 中转站管理系统',
    announcement: '欢迎使用AI API管理系统',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '加载设置失败',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '成功',
          description: '系统设置保存成功',
        })
      } else {
        toast({
          title: '失败',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '保存失败',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">系统设置</h2>
        <p className="text-muted-foreground">配置系统的全局设置</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统配置</CardTitle>
          <CardDescription>管理系统的核心设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system_name">系统名称</Label>
            <Input
              id="system_name"
              value={settings.system_name}
              onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement">系统公告</Label>
            <Textarea
              id="announcement"
              value={settings.announcement}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enable_registration">用户注册</Label>
              <Select
                value={settings.enable_registration}
                onValueChange={(value) => setSettings({ ...settings, enable_registration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">开启</SelectItem>
                  <SelectItem value="false">关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enable_login">用户登录</Label>
              <Select
                value={settings.enable_login}
                onValueChange={(value) => setSettings({ ...settings, enable_login: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">开启</SelectItem>
                  <SelectItem value="false">关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enable_register_captcha">注册验证码</Label>
              <Select
                value={settings.enable_register_captcha}
                onValueChange={(value) => setSettings({ ...settings, enable_register_captcha: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">开启</SelectItem>
                  <SelectItem value="false">关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enable_login_captcha">登录验证码</Label>
              <Select
                value={settings.enable_login_captcha}
                onValueChange={(value) => setSettings({ ...settings, enable_login_captcha: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">开启</SelectItem>
                  <SelectItem value="false">关闭</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
