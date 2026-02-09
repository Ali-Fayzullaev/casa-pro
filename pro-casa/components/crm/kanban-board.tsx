"use client";

import { CloseDealDialog } from "./forms/CloseDealDialog";
import { KanbanBoard as DndBoard } from "./KanbanBoard";
import { SellersListView } from "./SellersListView";
import { PropertiesListView } from "./PropertiesListView";
import { CreateSellerForm } from "./forms/CreateSellerForm";
import { CreatePropertyForm } from "./forms/CreatePropertyForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Settings, LayoutGrid, List } from "lucide-react";
import {
    SellerFunnelStage,
    PropertyFunnelStage,
    Seller,
    CrmProperty,
    CRMMode,
    CustomFunnel,
} from "@/types/kanban";
import { toast } from "sonner";
import { MonthFilter } from "./MonthFilter";
import { BrokerFilter } from "./BrokerFilter";
import { FormLinksButton } from "./FormLinksButton";
import { isSameMonth, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Columns Configuration (Standard)
const SELLER_COLUMNS = [
    { id: SellerFunnelStage.CONTACT, title: "Контакт", variant: "blue" },
    { id: SellerFunnelStage.INTERVIEW, title: "Интервью", variant: "pink" },
    { id: SellerFunnelStage.STRATEGY, title: "Стратегия", variant: "green" },
    { id: SellerFunnelStage.CONTRACT_SIGNING, title: "Договор", variant: "cyan" },
    { id: SellerFunnelStage.CANCELLED, title: "Отмена", variant: "default" },
] as const;

const PROPERTY_COLUMNS = [
    { id: PropertyFunnelStage.CREATED, title: "Создан", variant: "default" },
    { id: PropertyFunnelStage.PREPARATION, title: "Подготовка", variant: "pink" },
    { id: PropertyFunnelStage.LEADS, title: "Лиды", variant: "blue" },
    { id: PropertyFunnelStage.SHOWS, title: "Показы", variant: "cyan" },
    { id: PropertyFunnelStage.DEAL, title: "Сделка", variant: "green" },
    { id: PropertyFunnelStage.SOLD, title: "Продано", variant: "green" },
    { id: PropertyFunnelStage.CANCELLED, title: "Отмена", variant: "default" },
] as const;

export function KanbanBoard() {
    const [activeTab, setActiveTab] = useState<"sellers" | "properties">("sellers");
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [isSellerFormOpen, setIsSellerFormOpen] = useState(false);
    const [monthFilter, setMonthFilter] = useState<Date | undefined>(undefined);
    const [brokerFilter, setBrokerFilter] = useState<string | undefined>(undefined);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>("");

    // Hybrid CRM State
    const [crmMode, setCrmMode] = useState<CRMMode>("STANDARD");
    const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
                setUserId(user.id);

                // Determine Mode
                if (['DEVELOPER', 'AGENCY', 'REALTOR'].includes(user.role)) {
                    setCrmMode("CUSTOM");
                } else {
                    setCrmMode("STANDARD");
                }
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    // Property creation state
    const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
    const [selectedSellerId, setSelectedSellerId] = useState<string>("");

    // Deal Closing State
    const [isCloseDealOpen, setIsCloseDealOpen] = useState(false);
    const [propertyConfigToClose, setPropertyConfigToClose] = useState<{ id: string, stage: string } | null>(null);

    const queryClient = useQueryClient();

    // --- CUSTOM FUNNELS DATA ---
    const { data: customFunnels, isLoading: isLoadingFunnels } = useQuery({
        queryKey: ["custom-funnels"],
        queryFn: async () => {
            const res = await api.get("/custom-funnels");
            return res.data as CustomFunnel[];
        },
        enabled: crmMode === "CUSTOM",
    });

    // Set active funnel default
    useEffect(() => {
        if (customFunnels && customFunnels.length > 0 && !activeFunnelId) {
            const active = customFunnels.find(f => f.isActive) || customFunnels[0];
            setActiveFunnelId(active.id);
        }
    }, [customFunnels, activeFunnelId]);

    const activeFunnel = customFunnels?.find(f => f.id === activeFunnelId);

    // --- SELLERS DATA ---
    const { data: sellersData, isLoading: isLoadingSellers } = useQuery({
        queryKey: ["sellers", brokerFilter, activeFunnelId], // Refetch on funnel change
        queryFn: async () => {
            const res = await api.get("/sellers", {
                params: { brokerId: brokerFilter }
            });
            return res.data;
        },
        enabled: activeTab === "sellers",
    });

    const updateSellerStageMutation = useMutation({
        mutationFn: async ({ id, stage, isCustom }: { id: string; stage: string, isCustom: boolean }) => {
            const payload = isCustom ? { customStageId: stage } : { funnelStage: stage };
            const res = await api.put(`/sellers/${id}/stage`, payload);
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
        queryKey: ["properties", brokerFilter, activeFunnelId],
        queryFn: async () => {
            const res = await api.get("/crm-properties", {
                params: { brokerId: brokerFilter }
            });
            return res.data;
        },
        enabled: activeTab === "properties",
    });

    const updatePropertyStageMutation = useMutation({
        mutationFn: async ({ id, stage, isCustom }: { id: string; stage: string, isCustom: boolean }) => {
            const payload = isCustom ? { customStageId: stage } : { funnelStage: stage };
            return api.put(`/crm-properties/${id}/stage`, payload);
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
    const propertiesFiltered = filterByMonth(propertiesData?.properties || []);

    // Helper to get stage ID (Standard vs Custom)
    const getStageId = (item: Seller | CrmProperty) => {
        if (crmMode === "CUSTOM") {
            return item.customStageId || "uncategorized"; // Handling unassigned items?
        }
        return item.funnelStage;
    };

    // Dynamic Columns Generation
    const getColumns = () => {
        if (crmMode === "CUSTOM") {
            if (!activeFunnel) return [];
            return activeFunnel.stages.map(stage => ({
                id: stage.id,
                title: stage.name,
                color: stage.color,
                variant: 'default' // We use color prop instead
            }));
        }
        return activeTab === "sellers" ? SELLER_COLUMNS : PROPERTY_COLUMNS;
    };

    const columns = getColumns();

    const sellersGrouped = sellersFiltered.reduce(
        (acc: Record<string, Seller[]>, seller: Seller) => {
            const stageId = getStageId(seller);
            if (!acc[stageId]) acc[stageId] = [];
            acc[stageId].push(seller);
            return acc;
        },
        {}
    );

    const propertiesGrouped = propertiesFiltered.reduce(
        (acc: Record<string, CrmProperty[]>, prop: CrmProperty) => {
            const stageId = getStageId(prop);
            if (!acc[stageId]) acc[stageId] = [];
            acc[stageId].push(prop);
            return acc;
        },
        {}
    );

    const handleAddProperty = (sellerId: string) => {
        setSelectedSellerId(sellerId);
        setIsPropertyFormOpen(true);
    };

    const handlePropertyDragEnd = (id: string, stage: string) => {
        // Special Deal Closing Logic (Only for Standard Mode?)
        // If Custom Mode has a stage named "DEAL", maybe we should trigger it too?
        // For now, let's keep Deal Closing Logic for Standard Mode OR if stage name strictly matches?
        // Actually, custom stages have IDs, not Enum names. So we can't easily match 'DEAL'.
        // We'll skip special logic for Custom Mode for now unless we add a "Stage Type" to custom stages.

        if (crmMode === "STANDARD" && stage === PropertyFunnelStage.DEAL) {
            setPropertyConfigToClose({ id, stage });
            setIsCloseDealOpen(true);
            return;
        }

        updatePropertyStageMutation.mutate({ id, stage, isCustom: crmMode === "CUSTOM" });
    };

    const isCustom = crmMode === "CUSTOM";

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Forms */}
            {/* Seller Creation Form */}
            <CreateSellerForm
                open={isSellerFormOpen}
                onOpenChange={setIsSellerFormOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["sellers"] });
                    setIsSellerFormOpen(false);
                }}
                activeFunnelId={activeFunnelId}
            />
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    {!isCustom && (
                        <div className="flex items-center gap-2">
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
                        </div>
                    )}

                    {/* Custom Funnel Selector */}
                    {isCustom && (
                        <div className="flex items-center gap-2">
                            {isLoadingFunnels ? (
                                <Skeleton className="h-9 w-[200px]" />
                            ) : (
                                <Select value={activeFunnelId || ""} onValueChange={setActiveFunnelId}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Выберите воронку" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customFunnels?.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Link href="/dashboard/settings/funnels">
                                <Button variant="ghost" size="icon">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {!isCustom && (
                    <div className="flex gap-2 items-center flex-wrap relative z-10">
                        <div className="flex bg-muted rounded-lg p-1">
                            <Button
                                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 px-3"
                                onClick={() => {
                                    console.log("Switching to Kanban");
                                    setViewMode("kanban");
                                }}
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Канбан
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 px-3"
                                onClick={() => {
                                    console.log("Switching to List");
                                    setViewMode("list");
                                }}
                            >
                                <List className="h-4 w-4 mr-2" />
                                Список
                            </Button>
                        </div>
                    </div>
                )}

                {userRole === "ADMIN" && (
                    <BrokerFilter
                        value={brokerFilter}
                        onChange={setBrokerFilter}
                        className="w-[180px]"
                    />
                )}
                {userRole === "BROKER" && userId && (
                    <FormLinksButton userId={userId} />
                )}
                <MonthFilter date={monthFilter} setDate={setMonthFilter} />

                {(activeTab === "sellers" || isCustom) && (
                    <Button size="sm" onClick={() => setIsSellerFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {isCustom ? "Новая сделка" : "Новый продавец"}
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-auto bg-muted/10 p-4 rounded-lg border">
                {isCustom && !activeFunnel ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                        <p>У вас еще нет воронок. Создайте свою первую воронку!</p>
                        <Link href="/dashboard/settings/funnels">
                            <Button>Создать воронку</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {(activeTab === "sellers" || isCustom) ? (
                            isLoadingSellers ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">Загрузка продавцов...</div>
                            ) : (
                                <DndBoard
                                    type="sellers"
                                    // @ts-ignore
                                    columns={columns}
                                    items={sellersGrouped}
                                    onAddProperty={handleAddProperty}
                                    isCustom={isCustom}
                                    onDragEnd={(id, stage) => {
                                        updateSellerStageMutation.mutate({ id, stage, isCustom });
                                    }}
                                />
                            )
                        ) : (
                            isLoadingProperties ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">Загрузка объектов...</div>
                            ) : (
                                <DndBoard
                                    type="properties"
                                    // @ts-ignore
                                    columns={columns}
                                    items={propertiesGrouped}
                                    onDragEnd={handlePropertyDragEnd}
                                    isCustom={isCustom}
                                />
                            )
                        )}
                    </>
                )}
            </div>
        </div >
    );

    function handleCloseDealSuccess() {
        setPropertyConfigToClose(null);
    }
}
