'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Home, DollarSign, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApiUrl } from '@/lib/api-config';

interface Analytics {
  clients: {
    total: number;
    new: number;
    inProgress: number;
    dealClosed: number;
    rejected: number;
  };
  projects: {
    total: number;
    totalApartments: number;
  };
  apartments: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    expired: number;
  };
  revenue: {
    totalSales: number;
    avgPrice: number;
  };
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics>({
    clients: { total: 0, new: 0, inProgress: 0, dealClosed: 0, rejected: 0 },
    projects: { total: 0, totalApartments: 0 },
    apartments: { total: 0, available: 0, reserved: 0, sold: 0 },
    bookings: { total: 0, pending: 0, confirmed: 0, cancelled: 0, expired: 0 },
    revenue: { totalSales: 0, avgPrice: 0 },
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');

      const [clientsRes, projectsRes, apartmentsRes, bookingsRes] = await Promise.all([
        fetch(getApiUrl('/clients'), {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(getApiUrl('/projects'), {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(getApiUrl('/apartments'), {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(getApiUrl('/bookings'), {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();
      const apartmentsData = await apartmentsRes.json();
      const bookingsData = await bookingsRes.json();

      const clients = clientsData.clients || [];
      const projects = projectsData.projects || [];
      const apartments = apartmentsData.apartments || [];
      const bookings = bookingsData.bookings || [];

      // Расчет статистики клиентов
      const clientStats = {
        total: clients.length,
        new: clients.filter((c: any) => c.status === 'NEW').length,
        inProgress: clients.filter((c: any) => c.status === 'IN_PROGRESS').length,
        dealClosed: clients.filter((c: any) => c.status === 'DEAL_CLOSED').length,
        rejected: clients.filter((c: any) => c.status === 'REJECTED').length,
      };

      // Расчет статистики проектов
      const projectStats = {
        total: projects.length,
        totalApartments: projects.reduce((sum: number, p: any) =>
          sum + (p.apartmentStats?.total || 0), 0
        ),
      };

      // Расчет статистики квартир
      const apartmentStats = {
        total: apartments.length,
        available: apartments.filter((a: any) => a.status === 'AVAILABLE').length,
        reserved: apartments.filter((a: any) => a.status === 'RESERVED').length,
        sold: apartments.filter((a: any) => a.status === 'SOLD').length,
      };

      // Расчет статистики бронирований
      const bookingStats = {
        total: bookings.length,
        pending: bookings.filter((b: any) => b.status === 'PENDING').length,
        confirmed: bookings.filter((b: any) => b.status === 'CONFIRMED').length,
        cancelled: bookings.filter((b: any) => b.status === 'CANCELLED').length,
        expired: bookings.filter((b: any) => b.status === 'EXPIRED').length,
      };

      // Расчет доходов
      const soldApartments = apartments.filter((a: any) => a.status === 'SOLD');
      const totalSales = soldApartments.reduce((sum: number, a: any) =>
        sum + parseFloat(a.price || 0), 0
      );
      const avgPrice = soldApartments.length > 0 ? totalSales / soldApartments.length : 0;

      setAnalytics({
        clients: clientStats,
        projects: projectStats,
        apartments: apartmentStats,
        bookings: bookingStats,
        revenue: { totalSales, avgPrice },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getPercent = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Загрузка аналитики...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Аналитика и статистика
        </h1>
        <p className="text-muted-foreground mt-1">
          Общие показатели работы системы
        </p>
      </div>

      {/* Ключевые метрики */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Клиенты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.clients.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.clients.dealClosed} сделок закрыто
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Квартиры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.apartments.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.apartments.sold} продано
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Брони
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.bookings.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.bookings.pending + analytics.bookings.confirmed} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Доход
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(analytics.revenue.totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Средняя цена: {formatMoney(analytics.revenue.avgPrice)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Детальная статистика */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Клиенты */}
        <Card>
          <CardHeader>
            <CardTitle>Клиенты по статусам</CardTitle>
            <CardDescription>Распределение клиентов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Новые</Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercent(analytics.clients.new, analytics.clients.total)}%
                </span>
              </div>
              <span className="font-bold">{analytics.clients.new}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">В работе</Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercent(analytics.clients.inProgress, analytics.clients.total)}%
                </span>
              </div>
              <span className="font-bold">{analytics.clients.inProgress}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Сделка закрыта</Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercent(analytics.clients.dealClosed, analytics.clients.total)}%
                </span>
              </div>
              <span className="font-bold">{analytics.clients.dealClosed}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500">Отклонено</Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercent(analytics.clients.rejected, analytics.clients.total)}%
                </span>
              </div>
              <span className="font-bold">{analytics.clients.rejected}</span>
            </div>

            {/* Прогресс бар */}
            <div className="h-3 w-full rounded-full overflow-hidden flex mt-4">
              <div
                className="bg-gray-300"
                style={{ width: `${getPercent(analytics.clients.new, analytics.clients.total)}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${getPercent(analytics.clients.inProgress, analytics.clients.total)}%` }}
              />
              <div
                className="bg-green-500"
                style={{ width: `${getPercent(analytics.clients.dealClosed, analytics.clients.total)}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${getPercent(analytics.clients.rejected, analytics.clients.total)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Квартиры */}
        <Card>
          <CardHeader>
            <CardTitle>Квартиры по статусам</CardTitle>
            <CardDescription>Доступность квартир</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Доступно</Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercent(analytics.apartments.available, analytics.apartments.total)}%
                </span>
              </div>
              <span className="font-bold">{analytics.apartments.available}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500">Забронировано</Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercent(analytics.apartments.reserved, analytics.apartments.total)}%
                </span>
              </div>
              <span className="font-bold">{analytics.apartments.reserved}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-500">Продано</Badge>
                <span className="text-sm text-muted-foreground">
                  {getPercent(analytics.apartments.sold, analytics.apartments.total)}%
                </span>
              </div>
              <span className="font-bold">{analytics.apartments.sold}</span>
            </div>

            {/* Прогресс бар */}
            <div className="h-3 w-full rounded-full overflow-hidden flex mt-4">
              <div
                className="bg-green-500"
                style={{ width: `${getPercent(analytics.apartments.available, analytics.apartments.total)}%` }}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${getPercent(analytics.apartments.reserved, analytics.apartments.total)}%` }}
              />
              <div
                className="bg-gray-500"
                style={{ width: `${getPercent(analytics.apartments.sold, analytics.apartments.total)}%` }}
              />
            </div>

            {/* Конверсия */}
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">Конверсия:</span>
                <span className="text-muted-foreground">
                  {getPercent(analytics.apartments.sold, analytics.apartments.total)}% продано
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Бронирования и Проекты */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Бронирования */}
        <Card>
          <CardHeader>
            <CardTitle>Бронирования</CardTitle>
            <CardDescription>Статистика бронирований</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Ожидание</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {analytics.bookings.pending}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Подтверждено</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.bookings.confirmed}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Отменено</p>
                <p className="text-2xl font-bold text-red-600">
                  {analytics.bookings.cancelled}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Истекло</p>
                <p className="text-2xl font-bold text-gray-600">
                  {analytics.bookings.expired}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Проекты */}
        <Card>
          <CardHeader>
            <CardTitle>Проекты</CardTitle>
            <CardDescription>Жилые комплексы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Всего проектов</span>
              <span className="text-2xl font-bold">{analytics.projects.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Всего квартир</span>
              <span className="text-2xl font-bold">{analytics.projects.totalApartments}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-muted-foreground">Среднее кв. на проект</span>
              <span className="text-xl font-bold">
                {analytics.projects.total > 0
                  ? Math.round(analytics.projects.totalApartments / analytics.projects.total)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
