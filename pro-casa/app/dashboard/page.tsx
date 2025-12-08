"use client"

import { useEffect, useState } from "react"
import { Users, DollarSign, TrendingUp, Wallet, Plus, Calculator, Calendar, UserPlus, Building2, Home, Phone, MessageCircle, Eye, Mail } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { API_URL } from "@/lib/config"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface DashboardStats {
  totalClients: number
  totalDeals: number
  totalIncome: number
  balance: number
  clientsTrend: number
  dealsTrend: number
  salesChart: Array<{ month: string; deals: number; income: number }>
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface CourseProgress {
  id: string
  course: {
    title: string
  }
  progressPercent: number
  isCompleted: boolean
}

interface RecentClient {
  id: string
  firstName: string
  lastName: string
  phone: string
  status: string
  createdAt: string
}

interface RecentProperty {
  id: string
  title: string
  address: string
  price: number
  status: string
  images: string[]
  createdAt: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalDeals: 0,
    totalIncome: 0,
    balance: 0,
    clientsTrend: 0,
    dealsTrend: 0,
    salesChart: [],
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [recentClients, setRecentClients] = useState<RecentClient[]>([])
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const [statsRes, notificationsRes, coursesRes, clientsRes, propertiesRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/notifications?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/courses/progress/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/dashboard/recent-clients`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/dashboard/recent-properties`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json()
        setNotifications(notificationsData.notifications || [])
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourseProgress(Array.isArray(coursesData) ? coursesData : [])
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setRecentClients(clientsData || [])
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setRecentProperties(propertiesData || [])
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Доброе утро"
    if (hour < 18) return "Добрый день"
    return "Добрый вечер"
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const quickActions = user?.role === "DEVELOPER" ? [
    {
      label: "Добавить ЖК",
      icon: Building2,
      href: "/dashboard/projects/new",
      variant: "default" as const,
    },
    {
      label: "Каталог ЖК",
      icon: Home,
      href: "/dashboard/projects",
      variant: "outline" as const,
    },
  ] : [
    {
      label: "Добавить клиента",
      icon: UserPlus,
      href: "/dashboard/clients/new",
      variant: "default" as const,
    },
    {
      label: "Новый объект",
      icon: Plus,
      href: "/dashboard/properties/new",
      variant: "outline" as const,
    },
    {
      label: "Калькулятор",
      icon: Calculator,
      href: "/dashboard/mortgage?tab=calculator",
      variant: "outline" as const,
    },
    {
      label: "Бронь",
      icon: Calendar,
      href: "/dashboard/bookings/new",
      variant: "outline" as const,
    },
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.firstName || "Брокер"}!
        </h1>
        <p className="text-muted-foreground">
          Сегодня: {getCurrentDate()}
        </p>
      </div>

      {/* KPI Cards - разные для девелопера и брокера */}
      {user?.role === "DEVELOPER" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Мои проекты"
            value={stats.totalDeals || 0}
            icon={Building2}
          />
          <StatCard
            title="Всего квартир"
            value={stats.totalClients || 0}
            icon={Home}
          />
          <StatCard
            title="Активных броней"
            value={stats.balance || 0}
            icon={Calendar}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Всего клиентов"
            value={stats.totalClients}
            icon={Users}
            trend={{ value: stats.clientsTrend, isPositive: true }}
          />
          <StatCard
            title="Сделки"
            value={stats.totalDeals}
            icon={TrendingUp}
            trend={{ value: stats.dealsTrend, isPositive: true }}
          />
          <StatCard
            title="Доход"
            value={`${stats.totalIncome.toLocaleString()} ₸`}
            icon={DollarSign}
          />
          <StatCard
            title="Баланс"
            value={`${stats.balance.toLocaleString()} ₸`}
            icon={Wallet}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart - только для брокеров */}
          {user?.role !== "DEVELOPER" && stats.salesChart && stats.salesChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>График продаж</CardTitle>
                <CardDescription>Динамика сделок за последние 6 месяцев</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.salesChart}>
                    <XAxis 
                      dataKey="month" 
                      stroke="#888888"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#888888"
                      fontSize={12}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="deals" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Сделки"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Доход (₸)"
                    />
                  </LineChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
              <CardDescription>Часто используемые функции</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-3 ${user?.role === "DEVELOPER" ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className="h-auto flex-col gap-2 p-4"
                    asChild
                  >
                    <a href={action.href}>
                      <action.icon className="h-5 w-5" />
                      <span className="text-xs">{action.label}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Clients - только для брокеров */}
          {user?.role !== "DEVELOPER" && recentClients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Новые клиенты</CardTitle>
                <CardDescription>Последние добавленные клиенты</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/clients/${client.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{client.status}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `tel:${client.phone}`
                          }}
                          title="Позвонить"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`, '_blank')
                          }}
                          title="Написать в WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/dashboard/clients/${client.id}`
                          }}
                          title="Открыть карточку"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Properties - только для брокеров */}
          {user?.role !== "DEVELOPER" && recentProperties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Новые объекты</CardTitle>
                <CardDescription>Последние добавленные объекты</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/properties/${property.id}`}
                    >
                      {property.images && property.images[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{property.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{property.address}</p>
                        <p className="text-sm font-semibold text-primary">{property.price.toLocaleString()} ₸</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{property.status}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/dashboard/properties/${property.id}`
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Feed */}
          <Card>
            <CardHeader>
              <CardTitle>{user?.role === "DEVELOPER" ? "Брони от брокеров" : "Уведомления"}</CardTitle>
              <CardDescription>{user?.role === "DEVELOPER" ? "Новые брони на ваши квартиры" : "Последние события и сообщения"}</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {user?.role === "DEVELOPER" ? "Нет новых броней" : "Нет новых уведомлений"}
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="h-5 text-xs">
                              Новое
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        {/* Контакты брокера для девелопера */}
                        {user?.role === "DEVELOPER" && (notification as any).brokerPhone && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <p className="font-medium">{(notification as any).brokerName}</p>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{(notification as any).brokerPhone}</span>
                            </div>
                            {(notification as any).brokerEmail && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{(notification as any).brokerEmail}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - только для брокеров */}
        {user?.role !== "DEVELOPER" && (
        <div className="space-y-6">
          {/* Learning Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Обучение</CardTitle>
              <CardDescription>Ваш прогресс</CardDescription>
            </CardHeader>
            <CardContent>
              {courseProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Курсы не назначены
                </p>
              ) : (
                <div className="space-y-4">
                  {courseProgress.slice(0, 3).map((progress) => (
                    <div key={progress.id}>
                      <ProgressBar
                        value={progress.progressPercent}
                        label={progress.course.title}
                        size="sm"
                      />
                    </div>
                  ))}
                  {courseProgress.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <a href="/dashboard/profile">Посмотреть все курсы</a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balance Details */}
          <Card>
            <CardHeader>
              <CardTitle>Финансы</CardTitle>
              <CardDescription>Ваш баланс</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Заработано</span>
                  <span className="font-semibold">
                    {stats.totalIncome.toLocaleString()} ₸
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Casa Fee</span>
                  <span className="font-semibold text-muted-foreground">
                    {(stats.totalIncome - stats.balance).toLocaleString()} ₸
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Текущий баланс</span>
                  <span className="text-lg font-bold text-green-600">
                    {stats.balance.toLocaleString()} ₸
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/dashboard/profile">История платежей</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  )
}
