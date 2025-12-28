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
            // User object has 'id' field, not 'userId' (userId is only in JWT token)
            const id = u.id;
            setUserId(id);
            console.log('User ID extracted:', id, 'Full user:', u); // Debug log
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

    // Filter for brokers: only show MANUAL (personal) forms they're assigned to
    // ROUND_ROBIN (automatic) forms are completely hidden from brokers
    const visibleForms = userRole === 'BROKER'
        ? forms.filter(f => f.distributionType === 'MANUAL' && f.brokers.some(b => b.id === userId))
        : forms;

    const copyLink = (id: string, brokerId?: string) => {
        let url = `${window.location.origin}/forms/${id}`;
        if (brokerId) {
            url += `?brokerId=${brokerId}`;
            console.log('Copying personal link with brokerId:', brokerId); // Debug log
        }

        navigator.clipboard.writeText(url);

        // Show appropriate toast message
        if (brokerId) {
            toast.success("Персональная ссылка скопирована", {
                description: "Заявки с этой ссылки будут закреплены за вами"
            });
        } else {
            toast.success("Общая ссылка скопирована");
        }
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
                            <div className="space-y-2">
                                {/* Automatic (ROUND_ROBIN) Forms */}
                                {form.distributionType === 'ROUND_ROBIN' && userRole === 'ADMIN' && (
                                    <>
                                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => copyLink(form.id)}>
                                            <Copy className="mr-2 h-3 w-3" /> Общая ссылка
                                        </Button>
                                        <Link href={`/dashboard/forms/${form.id}`} className="w-full">
                                            <Button variant="secondary" size="sm" className="w-full justify-start">
                                                <ExternalLink className="mr-2 h-3 w-3" /> Редактировать
                                            </Button>
                                        </Link>
                                    </>
                                )}

                                {/* Personal (MANUAL) Forms */}
                                {form.distributionType === 'MANUAL' && (
                                    <>
                                        {userRole === 'ADMIN' && (
                                            <Link href={`/dashboard/forms/${form.id}`} className="w-full">
                                                <Button variant="secondary" size="sm" className="w-full justify-start">
                                                    <ExternalLink className="mr-2 h-3 w-3" /> Редактировать
                                                </Button>
                                            </Link>
                                        )}
                                        {userRole === 'BROKER' && (
                                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => copyLink(form.id, userId)}>
                                                <Copy className="mr-2 h-3 w-3" /> Моя персональная ссылка
                                            </Button>
                                        )}
                                    </>
                                )}

                                {/* Statistics Link (Admin only) */}
                                {userRole === 'ADMIN' && (
                                    <Link href={`/dashboard/forms/${form.id}/stats`} className="w-full">
                                        <Button variant="outline" size="sm" className="w-full justify-start mt-2">
                                            <svg className="mr-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Статистика
                                        </Button>
                                    </Link>
                                )}

                                {/* Broker Count (moved participants to edit page) */}
                                {userRole === 'ADMIN' && form.brokers.length > 0 && (
                                    <div className="text-xs text-muted-foreground pt-2 border-t">
                                        {form.brokers.length} {form.brokers.length === 1 ? 'участник' : 'участников'}
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
