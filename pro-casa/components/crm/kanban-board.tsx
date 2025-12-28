"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { Deal, DealStage } from "./types";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { getApiUrl, getAuthHeaders } from "@/lib/api-config";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link2, Copy } from "lucide-react";

interface KanbanBoardProps {
    initialDeals?: Deal[];
}

const STAGES: { id: DealStage; title: string; color: string }[] = [
    { id: DealStage.CONSULTATION, title: 'Консультация', color: 'border-blue-500' },
    { id: DealStage.CONTRACT, title: 'Договор', color: 'border-yellow-500' },
    { id: DealStage.PROMOTION, title: 'Продвижение', color: 'border-purple-500' },
    { id: DealStage.SHOWINGS, title: 'Показы', color: 'border-green-500' },
];

export function KanbanBoard({ initialDeals = [] }: KanbanBoardProps) {
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [myForms, setMyForms] = useState<{ id: string, title: string }[]>([]);

    useEffect(() => {
        fetchMyForms();
    }, []);

    const fetchMyForms = async () => {
        try {
            const res = await fetch(getApiUrl('/forms'), { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setMyForms(data.filter((f: any) => f.isActive));
            }
        } catch (e) { console.error(e); }
    };

    const copyFormLink = (formId: string) => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const userId = user.id; // User object has 'id', not 'userId'
            const url = `${window.location.origin}/forms/${formId}?brokerId=${userId}`;
            navigator.clipboard.writeText(url);
            toast.success("Ссылка скопирована в буфер обмена", {
                description: "Отправьте ссылку потенциальному клиенту"
            });
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            setIsLoading(true);
            const headers = getAuthHeaders();
            const res = await fetch(getApiUrl('/deals?limit=100'), { headers });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Error ${res.status}: ${text}`);
            }
            const data = await res.json();
            setDeals(data.deals);
        } catch (error) {
            console.error('Fetch Deals Error:', error);
            const msg = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Ошибка загрузки: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const updateDealStage = async (dealId: string, newStage: DealStage) => {
        const oldDeals = [...deals];
        setDeals(deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

        try {
            const res = await fetch(getApiUrl(`/deals/${dealId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ stage: newStage }),
            });

            if (!res.ok) throw new Error('Failed to update');
        } catch (error) {
            toast.error("Ошибка обновления статуса");
            setDeals(oldDeals);
        }
    };

    const handleCreateDeal = async (stage: DealStage, title: string, amount: string, phone: string, notes: string) => {
        try {
            const url = getApiUrl('/deals');
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    title: title,
                    amount: parseFloat(amount) || 0,
                    stage: stage,
                    clientName: title,
                    clientPhone: phone,
                    notes: notes,
                    source: "MANUAL",
                    commission: 0,
                    casaFee: 0,
                    objectType: "PROPERTY"
                }),
            });

            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(errorData);
            }

            toast.success("Сделка создана");
            fetchDeals();
        } catch (error) {
            console.error('Create Deal Error:', error);
            toast.error("Ошибка создания");
        }
    };

    const handleDeleteDeal = async (dealId: string) => {
        if (!confirm("Вы уверены, что хотите удалить эту сделку?")) return;

        try {
            const res = await fetch(getApiUrl(`/deals/${dealId}`), {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ошибка удаления");
            }

            toast.success("Сделка удалена");
            setDeals(deals.filter(d => d.id !== dealId));
        } catch (error: any) {
            console.error('Delete Deal Error:', error);
            toast.error(error.message || "Ошибка удаления");
        }
    };

    const reorderDeals = async (items: { id: string, order: number, stage: string }[]) => {
        try {
            await fetch(getApiUrl('/deals/reorder'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ items })
            });
        } catch (e) {
            console.error(e);
            toast.error("Ошибка сохранения порядка");
        }
    };

    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const deal = deals.find(d => d.id === active.id);
        if (deal) setActiveDeal(deal);
    };

    const onDragOver = (event: DragOverEvent) => {
        // Simple stage movement simulation could be added here if needed for smoother visual
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeDeal = deals.find(d => d.id === activeId);

        // Dropping on a container
        if (STAGES.some(s => s.id === overId)) {
            const newStage = overId as DealStage;
            if (activeDeal && activeDeal.stage !== newStage) {
                updateDealStage(activeId, newStage);
            }
            return;
        }

        const overDeal = deals.find(d => d.id === overId);

        if (activeDeal && overDeal) {
            const activeIndex = deals.findIndex(d => d.id === activeId);
            const overIndex = deals.findIndex(d => d.id === overId);

            if (deals[activeIndex].stage !== deals[overIndex].stage) {
                // Different stage
                updateDealStage(activeId, deals[overIndex].stage);
                return;
            }

            // Same stage reordering
            const newDeals = arrayMove(deals, activeIndex, overIndex);

            // Optimistic update
            setDeals(newDeals);

            // Calculate new orders for the specific stage
            const stageDeals = newDeals.filter(d => d.stage === activeDeal.stage);
            const updates = stageDeals.map((d, index) => ({
                id: d.id,
                order: index,
                stage: d.stage
            }));

            // API call
            reorderDeals(updates);
        }
    };

    const filteredDeals = deals.filter(deal => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            deal.client?.firstName?.toLowerCase().includes(q) ||
            deal.client?.lastName?.toLowerCase().includes(q) ||
            deal.amount.toString().includes(q) ||
            deal.id.toLowerCase().includes(q) ||
            deal.title?.toLowerCase().includes(q)
        );
    });

    if (isLoading && deals.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between gap-4 bg-background p-1">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Поиск и фильтр"
                            className="pl-8 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Link2 className="h-3 w-3" />
                                Мои ссылки
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2" align="end">
                            <div className="space-y-2">
                                <h4 className="font-medium text-xs text-muted-foreground px-2 mb-1">Ваши формы</h4>
                                {myForms.length === 0 ? (
                                    <div className="text-xs text-center py-2 text-muted-foreground">Нет активных форм</div>
                                ) : (
                                    myForms.map(form => (
                                        <div key={form.id} className="flex items-center justify-between p-2 hover:bg-muted rounded text-sm group">
                                            <span className="truncate max-w-[140px]" title={form.title}>{form.title}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => copyFormLink(form.id)}
                                                title="Копировать"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>


                    <Link href="/dashboard/crm/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium uppercase text-xs px-4">
                            <Plus className="h-3 w-3 mr-2" /> Новая сделка
                        </Button>
                    </Link>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex h-full gap-4 overflow-x-auto pb-4">
                    {STAGES.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            stage={col.id}
                            title={col.title}
                            color={col.color}
                            deals={filteredDeals.filter(d => d.stage === col.id)}
                            onQuickAdd={(title, amount, phone, notes) => handleCreateDeal(col.id, title, amount, phone, notes)}
                            onDeleteDeal={handleDeleteDeal}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeDeal ? <DealCard deal={activeDeal} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
