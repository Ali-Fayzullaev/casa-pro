"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getApiUrl, getAuthHeaders } from "@/lib/api-config";

interface LeadForm {
    id: string;
    title: string;
    distributionType: string;
    isActive: boolean;
    createdAt: string;
    brokers: { id: string; firstName: string; lastName: string }[];
}

export default function FormsListPage() {
    const [forms, setForms] = useState<LeadForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('');
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        // Get user info
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const u = JSON.parse(userStr);
            setUserRole(u.role);
            setUserId(u.userId || u.id);
        }
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const res = await fetch(getApiUrl('/forms'), {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setForms(data);
        } catch (error) {
            console.error(error);
            toast.error("Ошибка загрузки форм");
        } finally {
            setLoading(false);
        }
    };

    // Filter for brokers client-side
    const visibleForms = userRole === 'BROKER'
        ? forms.filter(f => f.brokers.some(b => b.id === userId))
        : forms;

    const copyLink = (id: string, brokerId?: string) => {
        let url = `${window.location.origin}/forms/${id}`;
        if (brokerId) url += `?brokerId=${brokerId}`;

        navigator.clipboard.writeText(url);
        toast.success(brokerId ? "Персональная ссылка скопирована" : "Общая ссылка скопирована");
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Конструктор форм</h2>
                {userRole === 'ADMIN' && (
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/forms/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Создать форму
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleForms.map((form) => (
                    <Card key={form.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold">{form.title}</CardTitle>
                                <Badge variant={form.isActive ? "default" : "secondary"}>
                                    {form.isActive ? "Активна" : "Архив"}
                                </Badge>
                            </div>
                            <CardDescription>
                                Тип: {form.distributionType === 'ROUND_ROBIN' ? 'Автоматическое' : 'Вручную'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Ваши ссылки</span>

                                    {/* Admin Action Buttons */}
                                    {userRole === 'ADMIN' && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 justify-start" onClick={() => copyLink(form.id)}>
                                                <Copy className="mr-2 h-3 w-3" /> Общая
                                            </Button>
                                            <Link href={`/dashboard/forms/${form.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full justify-start">
                                                    <ExternalLink className="mr-2 h-3 w-3" /> Ред.
                                                </Button>
                                            </Link>
                                        </div>
                                    )}

                                    {/* Broker sees Personal Link */}
                                    {(userRole === 'BROKER' || userRole === 'ADMIN') && (
                                        <Button variant="secondary" size="sm" className="justify-start w-full" onClick={() => copyLink(form.id, userId)}>
                                            <Copy className="mr-2 h-3 w-3" /> {userRole === 'ADMIN' ? 'Пример персональной' : 'Персональная ссылка'}
                                        </Button>
                                    )}

                                    <Link href={`/forms/${form.id}?brokerId=${userId}`} target="_blank" className="w-full">
                                        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                                            <ExternalLink className="mr-2 h-3 w-3" /> Просмотр
                                        </Button>
                                    </Link>
                                </div>

                                {userRole === 'ADMIN' && form.brokers.length > 0 && (
                                    <div className="flex flex-col gap-2 pt-2 border-t">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Участники ({form.brokers.length})</span>
                                        <div className="text-sm truncate">
                                            {form.brokers.map(b => `${b.firstName} ${b.lastName}`).join(', ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!loading && visibleForms.length === 0 && (
                    <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                        {userRole === 'ADMIN' ? 'Нет форм. Создайте первую!' : 'Вам пока не назначены формы.'}
                    </div>
                )}
            </div>
        </div>
    );
}
