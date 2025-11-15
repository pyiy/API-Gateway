'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Database, CheckCircle, XCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import { StationsManager } from '@/components/stations-manager'

export function UserDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stats/user')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      } else {
        toast({
          title: '错误',
          description: '加载统计信息失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '加载统计信息失败',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

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
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API站点总数
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalStations || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              已配置的AI API中转站数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              可用站点
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {stats?.validStations || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              正常运行的站点数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              失效站点
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {stats?.invalidStations || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              需要检查或更新的站点
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stations Manager */}
      <StationsManager />
    </div>
  )
}
