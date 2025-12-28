"use client";

import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Deal, DealStage } from "./types";
import { DealCard } from "./deal-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    stage: DealStage;
    title: string;
    deals: Deal[];
    color?: string;
    onQuickAdd?: (title: string, amount: string, phone: string, notes: string) => void;
}

export function KanbanColumn({ stage, title, deals, color = "bg-gray-100", onQuickAdd }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: stage,
        data: {
            type: "Column",
            stage,
        }
    });

    const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount), 0);

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newPhone, setNewPhone] = useState(""); // New
    const [newNotes, setNewNotes] = useState(""); // New

    const handleAdd = () => {
        if (!newTitle.trim()) return;
        onQuickAdd?.(newTitle, newAmount, newPhone, newNotes);
        setNewTitle("");
        setNewAmount("");
        setNewPhone("");
        setNewNotes("");
        setIsAdding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
        if (e.key === 'Escape') setIsAdding(false);
    };

    return (
        <div className="flex flex-col h-full min-w-[280px] w-full max-w-[350px]">
            {/* Header */}
            <div className={cn("group relative flex flex-col gap-1 border-t-2 pt-2 mb-2 bg-transparent", color.replace("bg-", "border-"))}>
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
                    <span className="text-muted-foreground text-xs font-bold">
                        {deals.length} сделок: {new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT', notation: 'compact' }).format(totalAmount)}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div
                ref={setNodeRef}
                className="flex-1 bg-muted/20 rounded-lg p-2 overflow-y-auto scrollbar-hide min-h-[500px]"
            >
                {/* Quick Add Button or Form */}
                {isAdding ? (
                    <Card className="mb-3 border-2 border-primary/20 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <CardContent className="p-3 space-y-2">
                            <input
                                autoFocus
                                placeholder="Имя клиента..."
                                className="w-full text-sm font-medium bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50 border-b border-muted pb-1"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {/* Phone Input */}
                            <input
                                placeholder="Телефон..."
                                className="w-full text-xs bg-muted/30 rounded px-2 py-1 border-none focus:outline-none"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Бюджет (₸)..."
                                    className="w-full text-xs bg-muted/50 rounded px-2 py-1 border-none focus:outline-none"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <textarea
                                placeholder="Примечание..."
                                className="w-full text-xs bg-muted/30 rounded px-2 py-1 border-none focus:outline-none resize-none"
                                rows={2}
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                }}
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:opacity-90 transition-opacity"
                                >
                                    Создать
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <button
                        className="w-full mb-3 py-2 border-2 border-dashed border-muted-foreground/10 hover:border-primary/50 text-muted-foreground/50 hover:text-primary rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                        onClick={() => setIsAdding(true)}
                    >
                        <span>+ Быстрое добавление</span>
                    </button>
                )}

                <SortableContext items={deals.map((d) => d.id)}>
                    {deals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
