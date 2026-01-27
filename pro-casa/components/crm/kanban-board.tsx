"use client";

import { CloseDealDialog } from "./forms/CloseDealDialog";
import { KanbanBoard as DndBoard } from "./KanbanBoard";
import { CreateSellerForm } from "./forms/CreateSellerForm";
import { CreatePropertyForm } from "./forms/CreatePropertyForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import {
    SellerFunnelStage,
    PropertyFunnelStage,
    Seller,
    CrmProperty,
} from "@/types/kanban";
import { toast } from "sonner";
import { MonthFilter } from "./MonthFilter";
import { isSameMonth, parseISO } from "date-fns";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";

// Columns Configuration
const SELLER_COLUMNS = [
    { id: SellerFunnelStage.CONTACT, title: "Контакт" },
    { id: SellerFunnelStage.INTERVIEW, title: "Интервью" },
    { id: SellerFunnelStage.STRATEGY, title: "Стратегия" },
    { id: SellerFunnelStage.CONTRACT_SIGNING, title: "Договор" },
];

const PROPERTY_COLUMNS = [
    { id: PropertyFunnelStage.CREATED, title: "Создан" },
    { id: PropertyFunnelStage.PREPARATION, title: "Подготовка" },
    { id: PropertyFunnelStage.LEADS, title: "Лиды" },
    { id: PropertyFunnelStage.SHOWS, title: "Показы" },
    { id: PropertyFunnelStage.DEAL, title: "Сделка" },
];

export function KanbanBoard() {
    const [activeTab, setActiveTab] = useState<"sellers" | "properties">("sellers");
    const [isSellerFormOpen, setIsSellerFormOpen] = useState(false);
    const [monthFilter, setMonthFilter] = useState<Date | undefined>(undefined);

    // Property creation state
    const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
    const [selectedSellerId, setSelectedSellerId] = useState<string>("");

    // Deal Closing State
    const [isCloseDealOpen, setIsCloseDealOpen] = useState(false);
    const [propertyConfigToClose, setPropertyConfigToClose] = useState<{ id: string, stage: string } | null>(null);

    const queryClient = useQueryClient();

    // ... queries remain ...

    // --- SELLERS DATA ---
    const { data: sellersData, isLoading: isLoadingSellers } = useQuery({
        queryKey: ["sellers"],
        queryFn: async () => {
            const res = await api.get("/sellers");
            return res.data;
        },
        enabled: activeTab === "sellers",
    });

    const updateSellerStageMutation = useMutation({
        mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
            const res = await api.put(`/sellers/${id}/stage`, { funnelStage: stage });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["sellers"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });

            if (data.activatedPropertiesCount && data.activatedPropertiesCount > 0) {
                toast.success(`Договор подписан! Активировано объектов: ${data.activatedPropertiesCount}`);
            } else {
                toast.success("Этап обновлён");
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Ошибка обновления");
        },
    });

    // --- PROPERTIES DATA ---
    const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
        queryKey: ["properties"],
        queryFn: async () => {
            const res = await api.get("/crm-properties");
            return res.data;
        },
        enabled: activeTab === "properties",
    });

    const updatePropertyStageMutation = useMutation({
        mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
            return api.put(`/crm-properties/${id}/stage`, { funnelStage: stage });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            toast.success("Этап обновлён");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Ошибка обновления");
        },
    });

    // --- FILTERING & GROUPING LOGIC ---
    const filterByMonth = (items: any[]) => {
        if (!monthFilter) return items;
        return items.filter(item => {
            if (!item.createdAt) return true; // Fallback
            return isSameMonth(parseISO(item.createdAt), monthFilter);
        });
    };

    const sellersFiltered = filterByMonth(sellersData?.sellers || []);
    const propertiesFiltered = filterByMonth(
        (propertiesData?.properties || []).filter((p: CrmProperty) => p.funnelStage !== PropertyFunnelStage.CREATED)
    );

    const sellersGrouped = sellersFiltered.reduce(
        (acc: Record<string, Seller[]>, seller: Seller) => {
            if (!acc[seller.funnelStage]) acc[seller.funnelStage] = [];
            acc[seller.funnelStage].push(seller);
            return acc;
        },
        {}
    );

    const propertiesGrouped = propertiesFiltered.reduce(
        (acc: Record<string, CrmProperty[]>, prop: CrmProperty) => {
            if (!acc[prop.funnelStage]) acc[prop.funnelStage] = [];
            acc[prop.funnelStage].push(prop);
            return acc;
        },
        {}
    );

    const handleAddProperty = (sellerId: string) => {
        setSelectedSellerId(sellerId);
        setIsPropertyFormOpen(true);
    };

    const handlePropertyDragEnd = (id: string, stage: string) => {
        const item = propertiesData?.properties.find((p: CrmProperty) => p.id === id);

        // If moving to DEAL stage, intercept and open dialog
        if (stage === PropertyFunnelStage.DEAL) {
            setPropertyConfigToClose({ id, stage });
            setIsCloseDealOpen(true);
            return;
        }

        if (item && item.funnelStage !== stage) {
            updatePropertyStageMutation.mutate({ id, stage });
        }
    };

    const handleCloseDealSuccess = () => {
        // If deal closed successfully, maybe we update stage locally or refetch handling it
        // The mutation on dialog handles backend
        // We just clear state
        setPropertyConfigToClose(null);
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Forms */}
            <CreateSellerForm open={isSellerFormOpen} onOpenChange={setIsSellerFormOpen} />
            <CreatePropertyForm
                open={isPropertyFormOpen}
                onOpenChange={setIsPropertyFormOpen}
                sellerId={selectedSellerId}
            />
            {propertyConfigToClose && (
                <CloseDealDialog
                    open={isCloseDealOpen}
                    onOpenChange={setIsCloseDealOpen}
                    propertyId={propertyConfigToClose.id}
                    onSuccess={handleCloseDealSuccess}
                />
            )}

            {/* Control Panel inside the tab */}
            <div className="flex items-center justify-between">
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as "sellers" | "properties")}
                    className="w-auto"
                >
                    <TabsList>
                        <TabsTrigger value="sellers">Продавцы</TabsTrigger>
                        <TabsTrigger value="properties">Объекты</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-2 items-center">
                    <MonthFilter date={monthFilter} setDate={setMonthFilter} />

                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Фильтры
                    </Button>
                    <Button size="sm" onClick={() => activeTab === "sellers" ? setIsSellerFormOpen(true) : null}>
                        <Plus className="mr-2 h-4 w-4" />
                        {activeTab === "sellers" ? "Новый продавец" : "Новый объект"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-muted/10 p-4 rounded-lg border">
                {activeTab === "sellers" ? (
                    isLoadingSellers ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">Загрузка продавцов...</div>
                    ) : (
                        <DndBoard
                            type="sellers"
                            columns={SELLER_COLUMNS}
                            items={sellersGrouped}
                            onAddProperty={handleAddProperty}
                            onDragEnd={(id, stage) => {
                                const item = sellersData?.sellers.find((s: Seller) => s.id === id);
                                if (item && item.funnelStage !== stage) {
                                    updateSellerStageMutation.mutate({ id, stage });
                                }
                            }}
                        />
                    )
                ) : (
                    isLoadingProperties ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">Загрузка объектов...</div>
                    ) : (
                        <DndBoard
                            type="properties"
                            columns={PROPERTY_COLUMNS}
                            items={propertiesGrouped}
                            onDragEnd={handlePropertyDragEnd}
                        />
                    )
                )}
            </div>
        </div>
    );
}
