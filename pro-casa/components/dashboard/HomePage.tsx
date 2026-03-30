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
    Home,
    Calculator,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchData = async () => {
            try {
                const res = await api.get("/analytics/dashboard");
                setData(res.data);
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
        return (
            <div className="p-8 space-y-8">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-9 w-80" />
                    <Skeleton className="h-5 w-96" />
                </div>
                {/* Quick actions skeleton */}
                <div className="flex gap-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-44 rounded-lg" />)}
                </div>
                {/* KPI skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>
                {/* Chart + sidebar skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="col-span-2 rounded-xl border border-border/40 bg-card p-6 space-y-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72" />
                        <Skeleton className="h-72 w-full rounded-lg" />
                    </div>
                    <div className="space-y-6">
                        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
                            <Skeleton className="h-5 w-36" />
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex justify-between items-center py-2">
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-6 w-12 rounded-full" />
                                </div>
                            ))}
                        </div>
                        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
                            <Skeleton className="h-5 w-44" />
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3 py-1">
                                    <Skeleton className="h-2 w-2 rounded-full mt-1.5 shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {getGreeting()}, {user?.firstName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Сводка вашей эффективности на сегодня
                </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/crm">
                    <Button size="sm" className="gap-2 bg-[#2E7D5E] hover:bg-[#256B4E] text-white shadow-sm">
                        <Home className="h-3.5 w-3.5" />Добавить объект
                    </Button>
                </Link>
                <Link href="/dashboard/mortgage">
                    <Button size="sm" variant="outline" className="gap-2 border-border/60 hover:bg-accent">
                        <Calculator className="h-3.5 w-3.5" />Ипотека
                    </Button>
                </Link>
                <Link href="/dashboard/crm">
                    <Button size="sm" variant="outline" className="gap-2 border-border/60 hover:bg-accent">
                        <CalendarPlus className="h-3.5 w-3.5" />Создать бронь
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Проектов" : "Активные сделки"}
                    value={data?.kpi.activeDeals || 0}
                    icon={Briefcase}
                    accentColor="bg-[#2E7D5E]/10 text-[#2E7D5E]"
                    iconBg="bg-[#2E7D5E]/10"
                />
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Квартир" : "Прогноз комиссии"}
                    value={user?.role === "DEVELOPER"
                        ? (data?.kpi.commissionForecast || 0)
                        : `${(data?.kpi.commissionForecast || 0).toLocaleString()} ₸`}
                    icon={DollarSign}
                    accentColor="text-[#FFD700]"
                    iconBg="bg-[#FFD700]/10"
                />
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Броней" : "Горячие лиды"}
                    value={data?.kpi.hotLeads || 0}
                    icon={Users}
                    accentColor="text-orange-600"
                    iconBg="bg-orange-50"
                />
                <KpiCard
                    title={user?.role === "DEVELOPER" ? "Статус" : "Конверсия"}
                    value={user?.role === "DEVELOPER" ? "Active" : `${data?.kpi.conversionRate}%`}
                    icon={TrendingUp}
                    accentColor="text-[#3A9D73]"
                    iconBg="bg-[#3A9D73]/10"
                />
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Main Chart */}
                <Card className="col-span-1 lg:col-span-2 border-border/40 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-foreground">Воронка объектов</CardTitle>
                                <CardDescription className="text-xs mt-0.5">Распределение по этапам сделки</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="h-80 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.charts.funnel} layout="horizontal" margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--accent))' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        fontSize: '12px',
                                    }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {data?.charts.funnel.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.stage)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Action Items */}
                    <Card className="border-border/40 shadow-sm overflow-hidden">
                        <div className="h-1 bg-linear-to-r from-red-500 to-orange-400" />
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                Требует внимания
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data?.actionItems.length === 0 ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                        <CheckCircle2 className="h-4 w-4 text-[#2E7D5E]" />
                                        Нет критических задач
                                    </div>
                                ) : (
                                    data?.actionItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-start p-2.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{item.residentialComplex}</p>
                                                <p className="text-xs text-red-500 font-medium mt-0.5">{item.activeStrategy}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] shrink-0 ml-2 border-red-200 text-red-600 bg-red-50">
                                                Risk
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                Недавняя активность
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data?.activity.map((item, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2E7D5E] shrink-0 ring-2 ring-[#2E7D5E]/20" />
                                        <div className="space-y-0.5 min-w-0">
                                            <p className="text-sm font-medium text-foreground leading-tight truncate">{item.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                            <p className="text-[10px] text-muted-foreground/60">
                                                {new Date(item.date).toLocaleDateString("ru-RU")}
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
                <Card className="border-border/40 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Users className="h-4 w-4 text-[#2E7D5E]" />
                            Показатели брокеров
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/40">
                                        <th className="text-left py-2.5 text-xs font-medium text-muted-foreground">Брокер</th>
                                        <th className="text-center py-2.5 text-xs font-medium text-muted-foreground">Объекты</th>
                                        <th className="text-center py-2.5 text-xs font-medium text-muted-foreground">Активные</th>
                                        <th className="text-center py-2.5 text-xs font-medium text-muted-foreground">Сделки</th>
                                        <th className="text-center py-2.5 text-xs font-medium text-muted-foreground">Продано</th>
                                        <th className="text-right py-2.5 text-xs font-medium text-muted-foreground">Комиссия</th>
                                        <th className="text-center py-2.5 text-xs font-medium text-muted-foreground">Конверсия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.brokersPerformance.map((broker) => (
                                        <tr key={broker.id} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                                            <td className="py-3 font-medium text-foreground">{broker.name}</td>
                                            <td className="text-center py-3 text-muted-foreground">{broker.totalProperties}</td>
                                            <td className="text-center py-3">
                                                <Badge variant="outline" className="text-[10px] bg-[#2E7D5E]/10 text-[#2E7D5E] border-[#2E7D5E]/20">
                                                    {broker.activeProperties}
                                                </Badge>
                                            </td>
                                            <td className="text-center py-3 text-muted-foreground">{broker.completedDeals}</td>
                                            <td className="text-center py-3">
                                                <Badge className="text-[10px] bg-[#2E7D5E] text-white">
                                                    {broker.soldDeals}
                                                </Badge>
                                            </td>
                                            <td className="text-right py-3 font-medium text-[#2E7D5E]">
                                                {broker.commissionForecast.toLocaleString('ru-RU')} ₸
                                            </td>
                                            <td className="text-center py-3">
                                                <span className={cn(
                                                    "text-xs font-medium",
                                                    broker.conversionRate >= 20 ? 'text-[#2E7D5E]' : 'text-muted-foreground'
                                                )}>
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

function KpiCard({ title, value, icon: Icon, accentColor, iconBg }: any) {
    return (
        <Card className="border-border/40 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{title}</span>
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
                        <Icon className={cn("h-4 w-4", accentColor)} />
                    </div>
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
            </CardContent>
        </Card>
    )
}

function getBarColor(stage: string) {
    switch (stage) {
        case 'deal': return '#2E7D5E';
        case 'shows': return '#FFD700';
        case 'leads': return '#3A9D73';
        default: return '#94a3b8';
    }
}
