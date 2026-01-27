"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User, Calendar, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InterestTabProps {
    propertyId: string;
}

export function InterestTab({ propertyId }: InterestTabProps) {
    const queryClient = useQueryClient();
    const [isAddingShow, setIsAddingShow] = useState(false);

    // Form state for new show
    const [selectedBuyerId, setSelectedBuyerId] = useState("");
    const [showDate, setShowDate] = useState("");
    const [showFeedback, setShowFeedback] = useState("");
    const [showRating, setShowRating] = useState("3");

    // Form state for new buyer (quick add)
    const [isAddingBuyer, setIsAddingBuyer] = useState(false);
    const [newBuyerName, setNewBuyerName] = useState("");
    const [newBuyerPhone, setNewBuyerPhone] = useState("");

    // --- QUERIES ---
    const { data: shows, isLoading: isLoadingShows } = useQuery({
        queryKey: ["shows", propertyId],
        queryFn: async () => {
            const res = await api.get(`/buyers/shows/${propertyId}`);
            return res.data;
        },
    });

    const { data: buyers } = useQuery({
        queryKey: ["buyers"],
        queryFn: async () => {
            const res = await api.get("/buyers");
            return res.data;
        },
    });

    // --- MUTATIONS ---
    const createBuyerMutation = useMutation({
        mutationFn: async () => {
            return api.post("/buyers", {
                firstName: newBuyerName,
                phone: newBuyerPhone,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buyers"] });
            setIsAddingBuyer(false);
            setNewBuyerName("");
            setNewBuyerPhone("");
            toast.success("Покупатель добавлен");
        },
        onError: () => toast.error("Ошибка добавления покупателя"),
    });

    const logShowMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/buyers/shows/${propertyId}`, {
                buyerId: selectedBuyerId,
                date: showDate || new Date().toISOString(),
                feedback: showFeedback,
                rating: Number(showRating),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shows", propertyId] });
            queryClient.invalidateQueries({ queryKey: ["properties"] }); // To update AI recommendation if changed
            setIsAddingShow(false);
            setShowFeedback("");
            toast.success("Показ зафиксирован");
        },
        onError: () => toast.error("Ошибка создания показа"),
    });

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">История показов</h3>
                <Button size="sm" onClick={() => setIsAddingShow(!isAddingShow)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Зафиксировать показ
                </Button>
            </div>

            {isAddingShow && (
                <div className="p-4 bg-gray-50 border rounded-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="font-medium text-sm">Новая запись о показе</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Покупатель</label>
                            <div className="flex gap-2">
                                <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите покупателя" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buyers?.map((b: any) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.firstName} {b.lastName} ({b.phone})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" onClick={() => setIsAddingBuyer(!isAddingBuyer)}>
                                    <User className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium">Дата показа</label>
                            <Input
                                type="datetime-local"
                                value={showDate}
                                onChange={(e) => setShowDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {isAddingBuyer && (
                        <div className="p-3 bg-white border rounded border-indigo-100 grid grid-cols-2 gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs">Имя</label>
                                <Input value={newBuyerName} onChange={e => setNewBuyerName(e.target.value)} placeholder="Иван" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs">Телефон</label>
                                <Input value={newBuyerPhone} onChange={e => setNewBuyerPhone(e.target.value)} placeholder="+7..." />
                            </div>
                            <Button size="sm" onClick={() => createBuyerMutation.mutate()} disabled={createBuyerMutation.isPending}>
                                Сохранить
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-medium">Обратная связь (Клиент сказал...)</label>
                        <Textarea
                            placeholder="Минусы, плюсы, возражения..."
                            value={showFeedback}
                            onChange={(e) => setShowFeedback(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Оценка объекта клиентом:</span>
                            <Select value={showRating} onValueChange={setShowRating}>
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => logShowMutation.mutate()} disabled={logShowMutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            Сохранить
                        </Button>
                    </div>
                </div>
            )}

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Дата</TableHead>
                            <TableHead>Покупатель</TableHead>
                            <TableHead>Фидбек</TableHead>
                            <TableHead>Оценка</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingShows ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Загрузка...</TableCell>
                            </TableRow>
                        ) : shows?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Показов еще не было
                                </TableCell>
                            </TableRow>
                        ) : (
                            shows?.map((show: any) => (
                                <TableRow key={show.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(new Date(show.date), "d MMM HH:mm", { locale: ru })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{show.buyer.firstName} {show.buyer.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{show.buyer.phone}</div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={show.feedback}>
                                        {show.feedback || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {show.rating && (
                                            <Badge variant={show.rating >= 4 ? "default" : show.rating >= 3 ? "secondary" : "destructive"}>
                                                {show.rating}/5
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
