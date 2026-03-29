"use client";

import { useEffect, useState } from "react";
import {
    Users,
    DollarSign,
    TrendingUp,
    Activity,
    AlertTriangle,
    Briefcase,
    CheckCircle2,
    Clock,
    ArrowRight,
    UserPlus,
    CalendarPlus,
    Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
    kpi: {
        activeDeals: number;
        commissionForecast: number;
        hotLeads: number;
        conversionRate: number;
    };
    charts: {
        funnel: Array<{ name: string; stage: string; value: number }>;
        dynamics: Array<{ date: string; leads: number }>;
    };
    activity: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        date: string;
    }>;
    actionItems: Array<{
        id: string;
        residentialComplex: string;
        activeStrategy: string;
        liquidityScore: number;
    }>;
    brokersPerformance?: Array<{
        id: number;
        name: string;
        totalProperties: number;
        activeProperties: number;
        completedDeals: number;
        soldDeals: number;
        commissionForecast: number;
        conversionRate: number;
    }>;
}

export function HomePage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [recentActivity, setRecentActivity] = useState<Array<{ id: string; type: string; title: string; description: string; date: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchData = async () => {
            try {
                const [dashRes, activityRes] = await Promise.all([
                    api.get("/analytics/dashboard"),
                    api.get("/dashboard/recent-activity").catch(() => ({ data: [] })),
                ]);
                setData(dashRes.data);
                setRecentActivity(activityRes.data);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Доброе утро";
        if (hour < 18) return "Добрый день";
        return "Добрый вечер";
    };

    if (loading) {
        return <div className="p-8 space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
            <div className="grid grid-cols-3 gap-6">
                <Skeleton className="h-[400px] col-span-2" />
                <Skeleton className="h-[400px]" />
            </div>
        </div>;
    }

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    {getGreeting()}, {user?.firstName} {user?.lastName}!
                </h1>
                <p className="text-muted-foreground mt-2">
                    Вот сводка вашей эффективности на сегодня.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/clients/new">
                    <Button className="gap-2"><UserPlus className="h-4 w-4" />Добавить клиента</Button>
                </Link>
                <Link href="/dashboard/clients?search=">
                    <Button variant="outline" className="gap-2"><Search className="h-4 w-4" />Проверить ИИН</Button>
                </Link>
                <Link href="/dashboard/bookings/new">
                    <Button variant="outline" className="gap-2"><CalendarPlus className="h-4 w-4" />Создать бронь</Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Проектов" : "Активные сделки"}
                    value={data?.kpi.activeDeals || 0}
                    icon={Briefcase}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Квартир" : "Прогноз комиссии"}
                    value={user?.role === "DEVELOPER"
                        ? (data?.kpi.commissionForecast || 0)
                        : `${(data?.kpi.commissionForecast || 0).toLocaleString()} ₸`}
                    icon={DollarSign}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Броней" : "Горячие лиды"}
                    value={data?.kpi.hotLeads || 0}
                    icon={Users}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Статус" : "Конверсия"}
                    value={user?.role === "DEVELOPER" ? "Active" : `${data?.kpi.conversionRate}%`}
                    icon={TrendingUp}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Chart: Sales Funnel */}
                <Card className="col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Воронка объектов</CardTitle>
                        <CardDescription>Распределение объектов по этапам сделки</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.charts.funnel} layout="horizontal" margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]}>
                                    {data?.charts.funnel.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.stage)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Right Column: Action Items */}
                <div className="space-y-6">
                    <Card className="border-l-4 border-l-red-500 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="h-5 w-5" />
                                Требует внимания
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data?.actionItems.length === 0 ? (
                                    <p className="text-sm text-gray-500">Всё отлично! Нет критических задач.</p>
                                ) : (
                                    data?.actionItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-start pb-3 border-b last:border-0 hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                                            <div>
                                                <p className="font-medium text-sm">{item.residentialComplex}</p>
                                                <p className="text-xs text-red-600 font-medium">{item.activeStrategy}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                                                Risk
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-gray-500" />
                                Недавняя активность
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.length === 0 ? (
                                    <p className="text-sm text-gray-500">Нет недавних действий</p>
                                ) : recentActivity.map((item, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                            item.type === 'client' ? 'bg-blue-400' :
                                            item.type === 'booking' ? 'bg-yellow-400' : 'bg-green-400'
                                        }`} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ADMIN ONLY: Brokers Performance */}
            {user?.role === 'ADMIN' && data?.brokersPerformance && data.brokersPerformance.length > 0 && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            Показатели брокеров
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="text-left py-2 font-medium">Брокер</th>
                                        <th className="text-center py-2 font-medium">Объекты</th>
                                        <th className="text-center py-2 font-medium">Активные</th>
                                        <th className="text-center py-2 font-medium">Сделки</th>
                                        <th className="text-center py-2 font-medium">Продано</th>
                                        <th className="text-right py-2 font-medium">Комиссия</th>
                                        <th className="text-center py-2 font-medium">Конверсия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.brokersPerformance.map((broker) => (
                                        <tr key={broker.id} className="border-b hover:bg-gray-50 transition">
                                            <td className="py-3 font-medium">{broker.name}</td>
                                            <td className="text-center py-3">{broker.totalProperties}</td>
                                            <td className="text-center py-3">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                    {broker.activeProperties}
                                                </Badge>
                                            </td>
                                            <td className="text-center py-3">{broker.completedDeals}</td>
                                            <td className="text-center py-3">
                                                <Badge variant="default" className="bg-green-500">
                                                    {broker.soldDeals}
                                                </Badge>
                                            </td>
                                            <td className="text-right py-3 font-medium text-green-600">
                                                {broker.commissionForecast.toLocaleString('ru-RU')} ₸
                                            </td>
                                            <td className="text-center py-3">
                                                <span className={broker.conversionRate >= 20 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                                    {broker.conversionRate.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="border-none shadow hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-full ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

function getBarColor(stage: string) {
    switch (stage) {
        case 'deal': return '#16a34a'; // green
        case 'shows': return '#eab308'; // yellow
        case 'leads': return '#3b82f6'; // blue
        default: return '#94a3b8'; // gray
    }
}
