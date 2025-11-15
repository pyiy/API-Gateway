'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function UserSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Profile state
  const [profile, setProfile] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Settings state
  const [settings, setSettings] = useState({
    chat_apps: '',
    models_endpoint: '/v1/models',
    chat_endpoint: '/v1/chat/completions',
    default_test_question: 'who are u?',
    default_stream: true,
    default_timeout: 12,
    default_concurrency: 3,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [profileRes, settingsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/settings'),
      ])

      const profileData = await profileRes.json()
      const settingsData = await settingsRes.json()

      if (profileData.success) {
        setProfile({
          ...profile,
          username: profileData.user.username,
        })
      }

      if (settingsData.success) {
        setSettings({
          ...settingsData.settings,
          chat_apps: JSON.stringify(settingsData.settings.chat_apps || [], null, 2),
        })
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

  const saveProfile = async () => {
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      toast({
        title: '错误',
        description: '两次输入的新密码不一致',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          currentPassword: profile.currentPassword,
          newPassword: profile.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '成功',
          description: '个人信息更新成功',
        })
        setProfile({
          ...profile,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
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
        description: '更新失败',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Parse chat apps JSON
      let chatApps = []
      try {
        chatApps = JSON.parse(settings.chat_apps)
      } catch (e) {
        toast({
          title: '错误',
          description: 'JSON格式错误',
          variant: 'destructive',
        })
        setIsSaving(false)
        return
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          chat_apps: chatApps,
        }),
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
        <h2 className="text-3xl font-bold tracking-tight">用户设置</h2>
        <p className="text-muted-foreground">管理您的账户和系统设置</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">个人信息</TabsTrigger>
          <TabsTrigger value="system">系统设置</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>修改您的用户名和密码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">修改密码</h3>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={profile.currentPassword}
                    onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={profile.newPassword}
                    onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={profile.confirmPassword}
                    onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={saveProfile} disabled={isSaving}>
                {isSaving ? '保存中...' : '保存个人信息'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>系统设置</CardTitle>
              <CardDescription>配置您的默认设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chat_apps">聊天应用配置 (JSON格式)</Label>
                <Textarea
                  id="chat_apps"
                  value={settings.chat_apps}
                  onChange={(e) => setSettings({ ...settings, chat_apps: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  使用JSON数组格式配置跳转聊天应用，支持变量: {'{key}'}, {'{address}'}, {'{model}'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="models_endpoint">模型获取地址</Label>
                  <Input
                    id="models_endpoint"
                    value={settings.models_endpoint}
                    onChange={(e) => setSettings({ ...settings, models_endpoint: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat_endpoint">聊天测试地址</Label>
                  <Input
                    id="chat_endpoint"
                    value={settings.chat_endpoint}
                    onChange={(e) => setSettings({ ...settings, chat_endpoint: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_test_question">默认测试问题</Label>
                <Input
                  id="default_test_question"
                  value={settings.default_test_question}
                  onChange={(e) => setSettings({ ...settings, default_test_question: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="default_stream"
                  checked={settings.default_stream}
                  onCheckedChange={(checked) => setSettings({ ...settings, default_stream: checked as boolean })}
                />
                <Label htmlFor="default_stream" className="cursor-pointer">默认使用流式请求</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_timeout">默认超时时间 (秒)</Label>
                  <Input
                    id="default_timeout"
                    type="number"
                    value={settings.default_timeout}
                    onChange={(e) => setSettings({ ...settings, default_timeout: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_concurrency">默认并发数</Label>
                  <Input
                    id="default_concurrency"
                    type="number"
                    value={settings.default_concurrency}
                    onChange={(e) => setSettings({ ...settings, default_concurrency: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? '保存中...' : '保存系统设置'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
