"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  Search,
  Bell,
  MessageCircle,
  Users,
  Building2,
  Eye,
  Calendar,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { API_URL } from "@/lib/config"

// Interfaces
interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  city?: string
  status: string
  clientType: string
  budget?: number
  createdAt: string
}

interface Property {
  id: string
  title: string
  propertyType: string
  city: string
  price: number
  status: string
  seller?: {
    firstName: string
    lastName: string
  }
}

interface Showing {
  id: string
  date: string
  status: string
  client: {
    firstName: string
    lastName: string
  }
  property: {
    title: string
    city: string
  }
}

interface Booking {
  id: string
  status: string
  createdAt: string
  client: {
    firstName: string
    lastName: string
  }
  apartment: {
    id: string
    number: string
    status?: 'AVAILABLE' | 'RESERVED' | 'SOLD'
    project: {
      name: string
    }
  }
}

const apartmentStatusLabels = {
  AVAILABLE: 'Доступна',
  RESERVED: 'Забронирована',
  SOLD: 'Продана',
}

const apartmentStatusColors = {
  AVAILABLE: 'bg-green-500',
  RESERVED: 'bg-yellow-500',
  SOLD: 'bg-purple-500',
}

const bookingStatusLabels = {
  PENDING: 'Ожидание',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  EXPIRED: 'Истекла',
  COMPLETED: 'Завершена',
}

const bookingStatusColors = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  EXPIRED: 'bg-gray-500',
  COMPLETED: 'bg-blue-500',
}

export default function CRMPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const initialTab = searchParams.get("tab") || "clients"
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [showings, setShowings] = useState<Showing[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  
  // Filters
  const [clientTypeFilter, setClientTypeFilter] = useState("ALL")
  const [clientSearch, setClientSearch] = useState("")

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    setLoading(true)
    try {
      switch (activeTab) {
        case "clients":
          await fetchClients(token)
          break
        case "objects":
          await fetchProperties(token)
          break
        case "showings":
          await fetchShowings(token)
          break
        case "bookings":
          await fetchBookings(token)
          break
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async (token: string) => {
    const params = new URLSearchParams({ limit: "50" })
    if (clientTypeFilter !== "ALL") params.append("clientType", clientTypeFilter)
    if (clientSearch) params.append("search", clientSearch)
    
    const res = await fetch(`${API_URL}/clients?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setClients(data.clients || [])
    }
  }

  const fetchProperties = async (token: string) => {
    const res = await fetch(`${API_URL}/properties?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setProperties(data.properties || [])
    }
  }

  const fetchShowings = async (token: string) => {
    // Показы пока заглушка - можно добавить API позже
    setShowings([])
  }

  const fetchBookings = async (token: string) => {
    const res = await fetch(`${API_URL}/bookings?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setBookings(data.bookings || [])
    }
  }

  const handleApartmentStatusChange = async (apartmentId: string | undefined, newStatus: string) => {
    if (!apartmentId) {
      toast({
        title: "Ошибка",
        description: "ID квартиры не найден",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/apartments/${apartmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update apartment status')
      }

      toast({
        title: "✅ Статус обновлён",
        description: `Статус квартиры изменён на "${apartmentStatusLabels[newStatus as keyof typeof apartmentStatusLabels]}"`,
      })

      // Обновляем список бронирований
      const fetchToken = localStorage.getItem("token")
      if (fetchToken) await fetchBookings(fetchToken)
    } catch (error) {
      console.error('Error updating apartment status:', error)
      toast({
        title: "❌ Ошибка",
        description: 'Не удалось обновить статус квартиры',
        variant: "destructive",
      })
    }
  }

  const handleBookingStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking status')
      }

      toast({
        title: "✅ Статус брони обновлён",
        description: `Статус брони изменён на "${bookingStatusLabels[newStatus as keyof typeof bookingStatusLabels]}"`,
      })

      // Обновляем список бронирований
      const fetchToken = localStorage.getItem("token")
      if (fetchToken) await fetchBookings(fetchToken)
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast({
        title: "❌ Ошибка",
        description: 'Не удалось обновить статус брони',
        variant: "destructive",
      })
    }
  }

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    return `https://wa.me/${cleanPhone}`
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "#3b82f6",
      IN_PROGRESS: "#f59e0b",
      DEAL_CLOSED: "#10b981",
      REJECTED: "#ef4444",
      ACTIVE: "#10b981",
      AVAILABLE: "#10b981",
      RESERVED: "#f59e0b",
      SOLD: "#6366f1",
      PENDING: "#f59e0b",
      CONFIRMED: "#10b981",
      CANCELLED: "#ef4444",
      COMPLETED: "#3b82f6",
    }
    
    const labels: Record<string, string> = {
      NEW: "Новый",
      IN_PROGRESS: "В работе",
      DEAL_CLOSED: "Сделка закрыта",
      REJECTED: "Отказ",
      ACTIVE: "Активен",
      AVAILABLE: "Активен",
      RESERVED: "Бронь",
      SOLD: "Продан",
      PENDING: "Ожидание",
      CONFIRMED: "Подтверждена",
      CANCELLED: "Отменена",
      COMPLETED: "Успешен",
    }
    
    return (
      <Badge style={{ backgroundColor: colors[status] || "#6b7280", color: "white" }}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getClientTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BUYER: "Покупатель",
      SELLER: "Продавец",
      NEW_BUILDING: "Новостройка",
    }
    return labels[type] || type
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard/crm?tab=${value}`, { scroll: false })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/notifications")}>
            <Bell className="h-4 w-4 mr-2" />
            Уведомления
          </Button>
          <Button onClick={() => router.push("/dashboard/properties/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить объект
          </Button>
          <Button onClick={() => router.push("/dashboard/clients/new")}>
            <Users className="h-4 w-4 mr-2" />
            Добавить клиента
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Клиенты
          </TabsTrigger>
          <TabsTrigger value="objects" className="gap-2">
            <Building2 className="h-4 w-4" />
            Объекты
          </TabsTrigger>
          <TabsTrigger value="showings" className="gap-2">
            <Eye className="h-4 w-4" />
            Показы
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Calendar className="h-4 w-4" />
            Брони
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Аналитика
          </TabsTrigger>
        </TabsList>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Список клиентов</CardTitle>
              <div className="flex items-center gap-4 mt-4">
                <Select value={clientTypeFilter} onValueChange={(v) => { setClientTypeFilter(v); fetchClients(localStorage.getItem("token") || "") }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Все" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Все</SelectItem>
                    <SelectItem value="BUYER">Покупатели</SelectItem>
                    <SelectItem value="SELLER">Продавцы</SelectItem>
                    <SelectItem value="NEW_BUILDING">Новостройка</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 flex-1 max-w-md">
                  <Input
                    placeholder="Поиск по имени"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchClients(localStorage.getItem("token") || "")}
                  />
                  <Button variant="secondary" size="icon" onClick={() => fetchClients(localStorage.getItem("token") || "")}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Связь</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">Загрузка...</TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Клиенты не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow 
                        key={client.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/clients/${client.id}?from=crm`)}
                      >
                        <TableCell className="font-medium">
                          {client.firstName} {client.lastName}
                        </TableCell>
                        <TableCell>{getClientTypeLabel(client.clientType)}</TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="text-primary p-0 h-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(getWhatsAppLink(client.phone), "_blank")
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Написать в WhatsApp
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objects Tab */}
        <TabsContent value="objects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Объекты недвижимости</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Продавец</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">Загрузка...</TableCell>
                    </TableRow>
                  ) : properties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Объекты не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    properties.map((property) => (
                      <TableRow 
                        key={property.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/properties/${property.id}?from=crm`)}
                      >
                        <TableCell className="font-medium">
                          {property.title}, {property.city}
                        </TableCell>
                        <TableCell>{Number(property.price).toLocaleString()} ₸</TableCell>
                        <TableCell>
                          {property.seller 
                            ? `${property.seller.firstName} ${property.seller.lastName}`
                            : "—"
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Showings Tab */}
        <TabsContent value="showings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Показы по объектам</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Покупатель</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Показы не найдены. Функционал в разработке.
                      </TableCell>
                    </TableRow>
                  ) : (
                    showings.map((showing) => (
                      <TableRow key={showing.id}>
                        <TableCell className="font-medium">
                          {showing.client.firstName} {showing.client.lastName}
                        </TableCell>
                        <TableCell>{showing.property.title}</TableCell>
                        <TableCell>{getStatusBadge(showing.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Брони в новостройках</CardTitle>
                <Button onClick={() => router.push('/dashboard/bookings/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Быстрое бронирование
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>Статус брони</TableHead>
                    <TableHead>Статус квартиры</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">Загрузка...</TableCell>
                    </TableRow>
                  ) : bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Брони не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.client.firstName} {booking.client.lastName}
                        </TableCell>
                        <TableCell>
                          {booking.apartment?.project?.name || "ЖК"} - кв. {booking.apartment?.number}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleBookingStatusChange(booking.id, value)}
                          >
                            <SelectTrigger className="w-[150px] h-8">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${bookingStatusColors[booking.status as keyof typeof bookingStatusColors] || 'bg-gray-500'}`} />
                                  {bookingStatusLabels[booking.status as keyof typeof bookingStatusLabels] || booking.status}
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                  Ожидание
                                </div>
                              </SelectItem>
                              <SelectItem value="CONFIRMED">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  Подтверждена
                                </div>
                              </SelectItem>
                              <SelectItem value="CANCELLED">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                  Отменена
                                </div>
                              </SelectItem>
                              <SelectItem value="COMPLETED">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  Завершена
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.apartment?.status || 'AVAILABLE')}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/bookings`)}
                          >
                            Подробнее
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Аналитика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Всего клиентов
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{clients.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Объектов
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{properties.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Активных броней
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {bookings.filter(b => b.status === "PENDING" || b.status === "CONFIRMED").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Закрытых сделок
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {clients.filter(c => c.status === "DEAL_CLOSED").length}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <p className="text-muted-foreground mt-6 text-center">
                Расширенная аналитика в разработке
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
