'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Users, Shield, Database, UserCheck, CheckCircle, XCircle } from 'lucide-react'

export function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stationStats, setStationStats] = useState<{ available: number; failed: number } | null>(null)
  const [isCheckingStations, setIsCheckingStations] = useState(false)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stats/admin')
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

  const checkAllStations = async () => {
    setIsCheckingStations(true)
    try {
      // Get all stations
      const stationsRes = await fetch('/api/stations')
      const stationsData = await stationsRes.json()
      
      if (!stationsData.success) return

      const stations = stationsData.stations
      let available = 0
      let failed = 0

      await Promise.all(
        stations.map(async (station: any) => {
          try {
            const response = await fetch(`/api/stations/${station.id}/models`)
            const data = await response.json()
            if (data.success) {
              available++
            } else {
              failed++
            }
          } catch {
            failed++
          }
        })
      )

      setStationStats({ available, failed })
    } catch (error) {
      console.error('Failed to check stations:', error)
    } finally {
      setIsCheckingStations(false)
    }
  }

  useEffect(() => {
    loadStats()
    checkAllStations()
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">系统统计</h2>
        <p className="text-muted-foreground">系统整体运行状态概览</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总用户数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              已注册的用户总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              管理员数量
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalAdmins || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              系统管理员账户数量
            </p>
          </CardContent>
        </Card>

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
              所有用户配置的站点总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              活跃用户
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {stats?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              当前活跃的用户数量
            </p>
          </CardContent>
        </Card>
      </div>

      {isCheckingStations ? (
        <Card>
          <CardHeader>
            <CardTitle>API站点可用性检测</CardTitle>
            <CardDescription>正在检测所有站点...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">检测中...</p>
            </div>
          </CardContent>
        </Card>
      ) : stationStats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                可用站点
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {stationStats.available}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                当前可正常访问的站点数量
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
                {stationStats.failed}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                无法访问或检测失败的站点
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>系统信息</CardTitle>
          <CardDescription>关于系统的其他重要信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">系统版本:</span>
              <span className="font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">数据库状态:</span>
              <span className="font-medium text-green-500">正常</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">系统运行时间:</span>
              <span className="font-medium">在线</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
