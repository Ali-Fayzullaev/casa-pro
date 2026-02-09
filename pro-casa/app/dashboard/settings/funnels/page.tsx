"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { CustomFunnel, CustomStage } from "@/types/kanban";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, GripVertical, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FunnelEditor } from "@/components/crm/FunnelEditor";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FunnelsPage() {
    const queryClient = useQueryClient();
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedFunnel, setSelectedFunnel] = useState<CustomFunnel | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: funnels, isLoading, isError } = useQuery<CustomFunnel[]>({
        queryKey: ["custom-funnels"],
        queryFn: async () => {
            const response = await api.get("/custom-funnels");
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/custom-funnels/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["custom-funnels"] });
            toast.success("Воронка удалена");
            setDeleteId(null);
        },
        onError: () => {
            toast.error("Ошибка удаления");
        },
    });

    const handleCreate = () => {
        setSelectedFunnel(null);
        setEditorOpen(true);
    };

    const handleEdit = (funnel: CustomFunnel) => {
        setSelectedFunnel(funnel);
        setEditorOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Воронки продаж</h1>
                    <p className="text-muted-foreground">
                        Настройте собственные воронки продаж и этапы сделок.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать воронку
                </Button>
            </div>

            {isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>
                        Не удалось загрузить воронки. Пожалуйста, попробуйте позже.
                    </AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Название</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Этапы</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : funnels && funnels.length > 0 ? (
                            funnels.map((funnel) => (
                                <TableRow key={funnel.id}>
                                    <TableCell className="font-medium">{funnel.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={funnel.isActive ? "default" : "secondary"}>
                                            {funnel.isActive ? "Активна" : "Скрыта"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {funnel.stages && funnel.stages.length > 0 ? (
                                                funnel.stages
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((stage) => (
                                                        <Badge
                                                            key={stage.id}
                                                            variant="outline"
                                                            style={{ borderColor: stage.color, color: stage.color }}
                                                            className="text-xs"
                                                        >
                                                            {stage.name}
                                                        </Badge>
                                                    ))
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">Нет этапов</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(funnel)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => handleDelete(funnel.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Нет созданных воронок.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <FunnelEditor
                open={editorOpen}
                onOpenChange={setEditorOpen}
                funnel={selectedFunnel}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Воронка будет удалена навсегда вместе со всеми этапами.
                            Связанные сделки могут потерять привязку к этапам.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
