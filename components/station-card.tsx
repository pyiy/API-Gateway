'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, Copy, CheckCircle, XCircle, ExternalLink, Loader2, Clock, Database } from 'lucide-react'
import { ModelsDialog } from '@/components/models-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UsageInfo {
  object: string
  name: string
  total_granted: number
  total_used: number
  total_available: number
  unlimited_quota: boolean
  model_limits: { [key: string]: boolean }
  model_limits_enabled: boolean
  expires_at: number
}

interface StationCardProps {
  station: any
  onEdit: (station: any) => void
  onDelete: (id: number) => void
  onValidityChange?: (isValid: boolean) => void
  onUsageChange?: (usage: UsageInfo | null) => void
}

export function StationCard({ station, onEdit, onDelete, onValidityChange, onUsageChange }: StationCardProps) {
  const { toast } = useToast()
  const [isChecking, setIsChecking] = useState(station.isChecking ?? false)
  const [isValid, setIsValid] = useState<boolean | null>(station.isValid ?? null)
  const [usage, setUsage] = useState<UsageInfo | null>(station.usage ?? null)
  const [modelsDialogOpen, setModelsDialogOpen] = useState(false)
  const [chatApps, setChatApps] = useState<any[]>([])

  useEffect(() => {
    setIsValid(station.isValid ?? null)
    setIsChecking(station.isChecking ?? false)
    setUsage(station.usage ?? null)
  }, [station.isValid, station.isChecking, station.usage])

  useEffect(() => {
    const loadChatApps = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()

        if (data.success && data.settings.chat_apps) {
          setChatApps(data.settings.chat_apps)
        }
      } catch (error) {
        // Silently fail
      }
    }
    
    loadChatApps()
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: '已复制',
      description: `${label}已复制到剪贴板`,
    })
  }

  const checkValidity = async () => {
    setIsChecking(true)
    try {
      // Check models first
      const response = await fetch(`/api/stations/${station.id}/models`)
      const data = await response.json()
      const valid = data.success
      setIsValid(valid)
      if (onValidityChange) {
        onValidityChange(valid)
      }

      // If valid, query usage info
      if (valid) {
        try {
          const usageResponse = await fetch(`/api/stations/${station.id}/usage`)
          const usageData = await usageResponse.json()
          if (usageData.success) {
            setUsage(usageData.usage)
            if (onUsageChange) {
              onUsageChange(usageData.usage)
            }
          } else {
            setUsage(null)
            if (onUsageChange) {
              onUsageChange(null)
            }
          }
        } catch {
          setUsage(null)
          if (onUsageChange) {
            onUsageChange(null)
          }
        }
      }
    } catch (error) {
      setIsValid(false)
      if (onValidityChange) {
        onValidityChange(false)
      }
    } finally {
      setIsChecking(false)
    }
  }

  const jumpToChatApp = (appName: string) => {
    const app = chatApps.find(a => Object.keys(a)[0] === appName)
    if (!app) return

    let url = app[appName]
    url = url.replace('{key}', station.api_key)
    url = url.replace('{address}', station.base_url)
    url = url.replace('{model}', '')

    window.open(url, '_blank')
  }

  const formatExpiry = (timestamp: number) => {
    if (timestamp === 0 || timestamp === -1) return '永不过期'
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{station.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(station)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(station.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">基础地址:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(station.base_url, '基础地址')}
              >
                <Copy className="h-3 w-3 mr-1" />
                复制
              </Button>
            </div>
            <div className="p-2 bg-muted rounded text-xs font-mono break-all">
              {station.base_url}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API Key:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(station.api_key, 'API Key')}
              >
                <Copy className="h-3 w-3 mr-1" />
                复制
              </Button>
            </div>
            <div className="p-2 bg-muted rounded text-xs font-mono break-all">
              {station.api_key}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">状态:</span>
            {isChecking ? (
              <Badge variant="outline">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                检查中...
              </Badge>
            ) : isValid === null ? (
              <Badge variant="outline">未检查</Badge>
            ) : isValid ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                有效
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                失效
              </Badge>
            )}
          </div>

          {usage && (
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                额度信息
              </div>
              {usage.unlimited_quota ? (
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">无限额度</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已用:</span>
                    <span className="font-mono">{usage.total_used.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">剩余:</span>
                    <span className="font-mono">{usage.total_available.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总额:</span>
                    <span className="font-mono">{usage.total_granted.toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              {usage.model_limits_enabled && Object.keys(usage.model_limits).length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">允许的模型:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(usage.model_limits).map((model) => (
                      <Badge key={model} variant="secondary" className="text-xs">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>到期: {formatExpiry(usage.expires_at)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {chatApps.length > 0 && (
              <Select onValueChange={(value) => jumpToChatApp(value)}>
                <SelectTrigger className="flex-1 min-w-[120px]">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="跳转聊天应用" />
                </SelectTrigger>
                <SelectContent>
                  {chatApps.map((app, index) => (
                    <SelectItem key={index} value={Object.keys(app)[0]}>
                      {Object.keys(app)[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={() => setModelsDialogOpen(true)}
            >
              查看模型
            </Button>
          </div>
        </CardContent>
      </Card>

      <ModelsDialog
        open={modelsDialogOpen}
        onOpenChange={setModelsDialogOpen}
        station={station}
      />
    </>
  )
}
