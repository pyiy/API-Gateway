'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface StationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  station: any | null
  onSave: () => void
}

export function StationDialog({ open, onOpenChange, station, onSave }: StationDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    base_url: '',
    api_key: '',
    models_endpoint: '/v1/models',
    chat_endpoint: '/v1/chat/completions',
    default_test_question: 'who are u?',
    default_stream: true,
    default_timeout: 12,
    default_concurrency: 3,
  })

  useEffect(() => {
    if (station) {
      setFormData(station)
    } else {
      setFormData({
        name: '',
        base_url: '',
        api_key: '',
        models_endpoint: '/v1/models',
        chat_endpoint: '/v1/chat/completions',
        default_test_question: 'who are u?',
        default_stream: true,
        default_timeout: 12,
        default_concurrency: 3,
      })
    }
  }, [station, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = station ? `/api/stations/${station.id}` : '/api/stations'
      const method = station ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '成功',
          description: station ? '更新成功' : '创建成功',
        })
        onSave()
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
        description: '操作失败',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{station ? '编辑中转站' : '新增中转站'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">AI API 基础地址 *</Label>
              <Input
                id="base_url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://api.example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="models_endpoint">模型获取地址</Label>
                <Input
                  id="models_endpoint"
                  value={formData.models_endpoint}
                  onChange={(e) => setFormData({ ...formData, models_endpoint: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat_endpoint">模型聊天测试地址</Label>
                <Input
                  id="chat_endpoint"
                  value={formData.chat_endpoint}
                  onChange={(e) => setFormData({ ...formData, chat_endpoint: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_test_question">默认聊天问题</Label>
              <Input
                id="default_test_question"
                value={formData.default_test_question}
                onChange={(e) => setFormData({ ...formData, default_test_question: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="default_stream"
                checked={formData.default_stream}
                onCheckedChange={(checked) => setFormData({ ...formData, default_stream: checked as boolean })}
              />
              <Label htmlFor="default_stream" className="cursor-pointer">默认流式请求</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_timeout">默认请求超时时间 (秒)</Label>
                <Input
                  id="default_timeout"
                  type="number"
                  value={formData.default_timeout}
                  onChange={(e) => setFormData({ ...formData, default_timeout: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_concurrency">默认测试并发数</Label>
                <Input
                  id="default_concurrency"
                  type="number"
                  value={formData.default_concurrency}
                  onChange={(e) => setFormData({ ...formData, default_concurrency: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
