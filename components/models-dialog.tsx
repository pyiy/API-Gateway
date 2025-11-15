'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Copy, Loader2, CheckCircle, XCircle, Trash2, ExternalLink } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ModelsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  station: any
}

export function ModelsDialog({ open, onOpenChange, station }: ModelsDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<any[]>([])
  const [testQuestion, setTestQuestion] = useState(station?.default_test_question || 'who are u?')
  const [useStream, setUseStream] = useState(station?.default_stream || true)
  const [timeout, setTimeout] = useState(station?.default_timeout || 12)
  const [concurrency, setConcurrency] = useState(station?.default_concurrency || 3)
  const [usageInfo, setUsageInfo] = useState<any>(null)
  const [chatApps, setChatApps] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      loadModels()
      loadUsage()
      loadChatApps()
    }
  }, [open])

  const loadModels = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/stations/${station.id}/models`)
      const data = await response.json()

      if (data.success) {
        setModels(data.models)
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
        description: '加载模型失败',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsage = async () => {
    try {
      const response = await fetch(`/api/stations/${station.id}/usage`)
      const data = await response.json()

      if (data.success) {
        setUsageInfo(data.usage)
      }
    } catch (error) {
      // Silently fail
    }
  }

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

  const filteredModels = searchQuery
    ? models.filter(model => model.toLowerCase().includes(searchQuery.toLowerCase()))
    : models

  const toggleModel = (model: string) => {
    const newSelected = new Set(selectedModels)
    if (newSelected.has(model)) {
      newSelected.delete(model)
    } else {
      newSelected.add(model)
    }
    setSelectedModels(newSelected)
  }

  const selectAll = () => {
    setSelectedModels(new Set(filteredModels))
  }

  const deselectAll = () => {
    setSelectedModels(new Set())
  }

  const testModels = async () => {
    if (selectedModels.size === 0) {
      toast({
        title: '提示',
        description: '请至少选择一个模型',
        variant: 'destructive',
      })
      return
    }

    setIsTesting(true)
    setTestResults([])

    try {
      const response = await fetch(`/api/stations/${station.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: Array.from(selectedModels),
          question: testQuestion,
          stream: useStream,
          timeout,
          concurrency,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResults(data.results)
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
        description: '测试失败',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const deleteFailedModels = () => {
    const failedModels = testResults.filter(r => !r.success).map(r => r.model)
    const newModels = models.filter(m => !failedModels.includes(m))
    setModels(newModels)
    setTestResults([])
    toast({
      title: '成功',
      description: `已删除 ${failedModels.length} 个失败的模型`,
    })
  }

  const copyModel = (model: string) => {
    navigator.clipboard.writeText(model)
    toast({
      title: '已复制',
      description: '模型名称已复制到剪贴板',
    })
  }

  const jumpToChatApp = (appName: string, model?: string) => {
    const app = chatApps.find(a => Object.keys(a)[0] === appName)
    if (!app) return

    let url = app[appName]
    url = url.replace('{key}', station.api_key)
    url = url.replace('{address}', station.base_url)
    if (model) {
      url = url.replace('{model}', model)
    }

    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{station.name} - 模型管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Usage Info */}
          {usageInfo && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold">额度信息</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>总额度: {usageInfo.total_granted}</div>
                <div>已使用: {usageInfo.total_used}</div>
                <div>剩余额度: {usageInfo.total_available}</div>
                <div>无限额度: {usageInfo.unlimited_quota ? '是' : '否'}</div>
              </div>
            </div>
          )}

          {/* Models List */}
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">模型列表 ({filteredModels.length})</h3>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={selectAll}>
                  全选
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAll}>
                  取消全选
                </Button>
                <Button size="sm" onClick={testModels} disabled={isTesting || selectedModels.size === 0}>
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  测试选中模型
                </Button>
                {testResults.some(r => !r.success) && (
                  <Button size="sm" variant="destructive" onClick={deleteFailedModels}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除失败模型
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <Input
                placeholder="搜索模型 (如: gpt, claude, llama...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">加载模型中...</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredModels.map((model) => {
                  const testResult = testResults.find(r => r.model === model)
                  return (
                    <div
                      key={model}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          checked={selectedModels.has(model)}
                          onCheckedChange={() => toggleModel(model)}
                        />
                        <span className="font-mono text-sm">{model}</span>
                        {testResult && (
                          testResult.success ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              成功
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              失败
                            </Badge>
                          )
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyModel(model)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {chatApps.length > 0 && (
                          <Select onValueChange={(value) => jumpToChatApp(value, model)}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue placeholder="聊天" />
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
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Test Settings */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold">测试设置</h3>
            <div className="space-y-2">
              <Label htmlFor="testQuestion">测试问题</Label>
              <Input
                id="testQuestion"
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useStream"
                checked={useStream}
                onCheckedChange={(checked) => setUseStream(checked as boolean)}
              />
              <Label htmlFor="useStream" className="cursor-pointer">使用流式请求</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">超时时间 (秒)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="concurrency">并发数</Label>
                <Input
                  id="concurrency"
                  type="number"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">测试结果</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{result.model}</span>
                      {result.success ? (
                        <Badge variant="default" className="bg-green-500">成功</Badge>
                      ) : (
                        <Badge variant="destructive">失败: {result.message}</Badge>
                      )}
                    </div>
                    {result.success && result.content && (
                      <p className="mt-2 text-muted-foreground">{result.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
