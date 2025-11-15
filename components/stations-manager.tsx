'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Plus, RefreshCw } from 'lucide-react'
import { StationCard } from '@/components/station-card'
import { StationDialog } from '@/components/station-dialog'

export function StationsManager() {
  const { toast } = useToast()
  const [stations, setStations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStation, setEditingStation] = useState<any>(null)
  const [isCheckingAll, setIsCheckingAll] = useState(false)
  const [hasInitialChecked, setHasInitialChecked] = useState(false)

  const loadStations = async () => {
    try {
      const response = await fetch('/api/stations')
      const data = await response.json()

      if (data.success) {
        setStations(data.stations)
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '加载API站点失败',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStations()
  }, [])

  useEffect(() => {
    if (!isLoading && stations.length > 0 && !hasInitialChecked) {
      setHasInitialChecked(true)
      checkAllStations()
    }
  }, [isLoading, stations, hasInitialChecked])

  const handleCreate = () => {
    setEditingStation(null)
    setDialogOpen(true)
  }

  const handleEdit = (station: any) => {
    setEditingStation(station)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个API站点吗？')) return

    try {
      const response = await fetch(`/api/stations/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '成功',
          description: '删除成功',
        })
        loadStations()
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
        description: '删除失败',
        variant: 'destructive',
      })
    }
  }

  const handleSave = () => {
    setDialogOpen(false)
    loadStations()
  }

  const checkAllStations = async () => {
    setIsCheckingAll(true)
    setStations(prev => prev.map(s => ({ ...s, isValid: null, isChecking: true, usage: null })))
    
    const results: any = {}
    const usageResults: any = {}
    
    try {
      await Promise.all(
        stations.map(async (station) => {
          try {
            // Check validity
            const response = await fetch(`/api/stations/${station.id}/models`)
            const data = await response.json()
            results[station.id] = data.success
            
            // If valid, query usage
            if (data.success) {
              try {
                const usageResponse = await fetch(`/api/stations/${station.id}/usage`)
                const usageData = await usageResponse.json()
                if (usageData.success) {
                  usageResults[station.id] = usageData.usage
                }
              } catch {
                usageResults[station.id] = null
              }
            }
          } catch {
            results[station.id] = false
          }
        })
      )
      
      setStations(prev => prev.map(station => ({
        ...station,
        isValid: results[station.id],
        isChecking: false,
        usage: usageResults[station.id] || null
      })))
      
      toast({
        title: '检查完成',
        description: '所有站点可用性检查完成',
      })
    } catch (error) {
      toast({
        title: '错误',
        description: '检查失败',
        variant: 'destructive',
      })
    } finally {
      setIsCheckingAll(false)
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>AI API 中转站管理</CardTitle>
              <CardDescription>管理您的AI API中转站配置</CardDescription>
            </div>
            <div className="flex gap-2">
              {stations.length > 0 && (
                <Button onClick={checkAllStations} disabled={isCheckingAll} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingAll ? 'animate-spin' : ''}`} />
                  检查全部可用性
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                新增中转站
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>还没有添加任何API站点</p>
              <p className="mt-2">点击上方按钮添加您的第一个站点</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onValidityChange={(isValid) => {
                    setStations(prev => prev.map(s => 
                      s.id === station.id ? { ...s, isValid } : s
                    ))
                  }}
                  onUsageChange={(usage) => {
                    setStations(prev => prev.map(s => 
                      s.id === station.id ? { ...s, usage } : s
                    ))
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        station={editingStation}
        onSave={handleSave}
      />
    </div>
  )
}
