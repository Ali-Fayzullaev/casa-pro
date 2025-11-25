"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Calendar, TrendingUp, Plus, UserPlus, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalClients: number
  activeBookings: number
  totalProjects: number
  monthlyGrowth: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeBookings: 0,
    totalProjects: 0,
    monthlyGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Загружаем статистику
      const [clientsRes, bookingsRes, projectsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/clients`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/bookings?status=PENDING&status=CONFIRMED`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      if (clientsRes.ok && bookingsRes.ok && projectsRes.ok) {
        const clientsData = await clientsRes.json()
        const bookingsData = await bookingsRes.json()
        const projectsData = await projectsRes.json()

        // Рассчитываем рост (процент новых клиентов за месяц)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const newClientsThisMonth = clientsData.clients?.filter((c: any) => {
          const createdDate = new Date(c.createdAt)
          return createdDate.getMonth() === currentMonth && 
                 createdDate.getFullYear() === currentYear
        }).length || 0
        
        const totalClients = clientsData.total || clientsData.clients?.length || 0
        const monthlyGrowth = totalClients > 0 
          ? Math.round((newClientsThisMonth / totalClients) * 100) 
          : 0

        setStats({
          totalClients,
          activeBookings: bookingsData.bookings?.filter((b: any) => 
            b.status === 'PENDING' || b.status === 'CONFIRMED'
          ).length || 0,
          totalProjects: projectsData.pagination?.total || projectsData.projects?.length || 0,
          monthlyGrowth,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Фильтруем быстрые действия по роли
  const getAllQuickActions = () => [
    {
      title: "Добавить клиента",
      description: "Создать карточку нового клиента",
      icon: UserPlus,
      href: "/dashboard/clients/new",
      color: "text-blue-500",
      roles: ["BROKER", "ADMIN"],
    },
    {
      title: "Создать ЖК",
      description: "Добавить новый жилой комплекс",
      icon: Building2,
      href: "/dashboard/projects/new",
      color: "text-purple-500",
      roles: ["DEVELOPER", "ADMIN"],
    },
    {
      title: "Расчет ипотеки",
      description: "Рассчитать ежемесячный платеж",
      icon: CheckCircle2,
      href: "/dashboard/calculator",
      color: "text-green-500",
      roles: ["BROKER", "ADMIN"],
    },
  ]

  const quickActions = getAllQuickActions().filter(action => 
    action.roles.includes(user?.role || "BROKER")
  )

  const recentActivity = [
    {
      type: "client",
      message: "Добавлен новый клиент",
      time: "2 минуты назад",
    },
    {
      type: "booking",
      message: "Создана новая бронь",
      time: "30 минут назад",
    },
    {
      type: "project",
      message: "Обновлен ЖК «Комфорт»",
      time: "1 час назад",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Добро пожаловать{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Вот что происходит в вашей системе сегодня
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {user?.role !== 'DEVELOPER' && (
          <Card className="border-border/50 hover:border-border transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {user?.role === 'BROKER' ? 'Мои клиенты' : 'Всего клиентов'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalClients === 0 ? 'Начните с добавления первого клиента' : 'В системе'}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'BROKER' ? 'Мои брони' : 
               user?.role === 'DEVELOPER' ? 'Брони на мои квартиры' : 
               'Активные брони'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeBookings === 0 ? 'Нет активных броней' : 'Активных бронирований'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'DEVELOPER' ? 'Мои проекты' : 'Жилых комплексов'}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalProjects === 0 ? 'Добавьте новостройки' : 'Жилых комплексов'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Рост за месяц</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : `${stats.monthlyGrowth}%`}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.monthlyGrowth > 0 ? 'По сравнению с прошлым месяцем' : 'Начните работу для роста'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Быстрые действия</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => router.push(action.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-base mt-2">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Последняя активность</CardTitle>
          <CardDescription>Недавние действия в системе</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0"
              >
                <div className="p-2 rounded-lg bg-muted/50">
                  {activity.type === "client" && <Users className="h-4 w-4" />}
                  {activity.type === "booking" && <Calendar className="h-4 w-4" />}
                  {activity.type === "project" && <Building2 className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Пока нет активности
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
