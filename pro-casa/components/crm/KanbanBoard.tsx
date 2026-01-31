"use client";

import { useState } from "react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    TouchSensor,
    closestCorners,
    pointerWithin,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query"; // NEW
import { SellerCard, SellerCardBase } from "./SellerCard";
import { PropertyCard, PropertyCardBase } from "./PropertyCard";
import { KanbanColumn } from "./KanbanColumn";
import { Seller, CrmProperty, SellerFunnelStage, PropertyFunnelStage } from "@/types/kanban";
import { createPortal } from "react-dom";
import { MissingDataDialog } from "./dialogs/MissingDataDialog";
import { ChecklistDialog } from "./dialogs/ChecklistDialog";
import { MediaGatewayDialog } from "./dialogs/MediaGatewayDialog";
import { toast } from "sonner";
import { StrategyLoader } from "./StrategyLoader";
import { StrategySelectDialog } from "./dialogs/StrategySelectDialog";
import { AiStrategyConfirmDialog } from "./dialogs/AiStrategyConfirmDialog";
import { StrategiesSheet } from "./sheets/StrategiesSheet";
import api from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreateSellerForm } from "./forms/CreateSellerForm";
import { CreatePropertyForm } from "./forms/CreatePropertyForm";
import { Plus, Filter, Search, Target } from "lucide-react";

type KanbanItem =
    | { type: "Seller"; item: Seller }
    | { type: "Property"; item: CrmProperty };

const STAGE_DESCRIPTIONS: Record<string, string> = {
    [SellerFunnelStage.CONTACT]: "Новые заявки. Только имя и телефон.\nСбор к.д, первичное касание.",
    [SellerFunnelStage.INTERVIEW]: "Сбор детальной информации: причина, сроки, финансы.\nЗаполнение анкеты.",
    [SellerFunnelStage.STRATEGY]: "Анализ AI и выбор стратегии продажи.\nАвтоматический подбор условий.",
    [SellerFunnelStage.CONTRACT_SIGNING]: "Подписание договора и начало работы.\nОфициальное закрепление.",
    [PropertyFunnelStage.PREPARATION]: "Подготовка объекта к продаже (Фото, Клининг).",
    [PropertyFunnelStage.LEADS]: "Активное продвижение и сбор заявок.",
    [PropertyFunnelStage.SHOWS]: "Организация и проведение показов.",
    [PropertyFunnelStage.DEAL]: "Обсуждение условий и оформление сделки.",
    [PropertyFunnelStage.SOLD]: "Сделка закрыта. Объект продан.",
    [SellerFunnelStage.CANCELLED]: "Клиент отказался / Объект не продан."
};

interface KanbanBoardProps {
    type: "sellers" | "properties";
    columns: { id: string; title: string }[];
    items: Record<string, (Seller | CrmProperty)[]>;
    onDragEnd: (id: string, newStage: string) => void;
    onAddProperty?: (sellerId: string) => void;
}

export function KanbanBoard({ type, columns, items, onDragEnd, onAddProperty }: KanbanBoardProps) {
    const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Strategies Sheet State
    const [strategiesSheetOpen, setStrategiesSheetOpen] = useState(false);

    // AI Dialog State
    const [aiParams, setAiParams] = useState<{
        open: boolean;
        strategyCode: string | null;
        explanation: string | null;
    }>({ open: false, strategyCode: null, explanation: null });

    // Strategy Dialog State
    const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);

    // Form Control State
    const [isSellerFormOpen, setIsSellerFormOpen] = useState(false);
    const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
    const [selectedSellerId, setSelectedSellerId] = useState<string>("");
    const [selectedSellerData, setSelectedSellerData] = useState<any>(null); // For Edit Mode

    // Validation State
    const [missingDataOpen, setMissingDataOpen] = useState(false);
    const [missingDataMode, setMissingDataMode] = useState<"INTERVIEW" | "STRATEGY">("STRATEGY"); // Default
    const [validationSellerId, setValidationSellerId] = useState<string | null>(null);
    const [validationProperties, setValidationProperties] = useState<any[]>([]);
    const [pendingStage, setPendingStage] = useState<string | null>(null);

    // Gate States
    const [mediaOpen, setMediaOpen] = useState(false);
    const [validationPropertyId, setValidationPropertyId] = useState<string | null>(null);
    const [currentImageCount, setCurrentImageCount] = useState(0);

    const [checklistOpen, setChecklistOpen] = useState(false);

    // AI Strategy State
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

    // Delete mutations
    const deleteSellerMutation = useMutation({
        mutationFn: async (sellerId: string) => {
            await api.delete(`/sellers/${sellerId}`);
        },
        onSuccess: () => {
            toast.success("Продавец удалён");
            queryClient.invalidateQueries({ queryKey: ["sellers"] });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.error || error.message || "Ошибка удаления";
            toast.error(msg);
        }
    });

    const deletePropertyMutation = useMutation({
        mutationFn: async (propertyId: string) => {
            await api.delete(`/crm-properties/${propertyId}`);
        },
        onSuccess: () => {
            toast.success("Объект архивирован");
            queryClient.invalidateQueries({ queryKey: ["sellers"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.error || error.message || "Ошибка удаления";
            toast.error(msg);
        }
    });

    const handleAddProperty = (sellerId: string) => {
        setSelectedSellerId(sellerId);
        setIsPropertyFormOpen(true);
    };

    const handleEditSeller = (seller: Seller) => {
        // RESTRICTION: Do not open edit form on click for CONTACT stage
        // Use drags to move to INTERVIEW to fill data
        if (seller.funnelStage === SellerFunnelStage.CONTACT) {
            return;
        }

        setSelectedSellerId(seller.id);
        setSelectedSellerData(seller);
        setIsSellerFormOpen(true);
    };



    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current as KanbanItem;
        setActiveItem(data);
    };

    const analyzeStrategy = async (seller: Seller, stageToSet?: string | null) => {
        // VISUAL LOADING STATE
        setIsAiAnalyzing(true);
        const loadingToast = toast.loading("AI анализирует объект...");

        try {
            const propertyId = seller.properties?.[0]?.id;

            if (!propertyId) {
                toast.dismiss(loadingToast);
                setIsAiAnalyzing(false);
                toast.error("Нет объекта недвижимости для анализа. Добавьте объект.");
                return;
            }

            // Call recalculate-strategy
            const res = await api.post(`/crm-properties/${propertyId}/recalculate-strategy`);

            // RESPONSE PARSING FIX: Backend returns { property: { activeStrategy: ... } }
            const { property } = res.data;
            const activeStrategy = property?.activeStrategy;
            const strategyExplanation = property?.strategyExplanation;

            toast.dismiss(loadingToast);
            setIsAiAnalyzing(false); // Stop loading

            if (!activeStrategy) {
                throw new Error("AI вернул пустую стратегию");
            }

            // Set pending stage if we are moving
            if (stageToSet) {
                setValidationSellerId(seller.id);
                setPendingStage(stageToSet);
            } else {
                setValidationSellerId(seller.id);
            }

            // Open AI Dialog
            setAiParams({
                open: true,
                strategyCode: activeStrategy,
                explanation: strategyExplanation
            });

        } catch (err: any) {
            console.error(err);
            toast.dismiss(loadingToast);
            setIsAiAnalyzing(false);
            const msg = err.response?.data?.error || err.message || "Ошибка";
            toast.error(`Ошибка AI анализа: ${msg} (Попробуйте обновить страницу)`);
        }
    };

    const handleSellerFormSuccess = () => {
        setIsSellerFormOpen(false);
        queryClient.invalidateQueries({ queryKey: ["sellers"] }); // Ensure we fetch fresh data

        // 1. If we were waiting for a stage move
        if (validationSellerId && pendingStage) {

            // SPECIAL CASE: Auto-trigger Strategy Analysis if moving to Strategy
            if (pendingStage === SellerFunnelStage.STRATEGY) {
                // We must find the seller to pass to analyzeStrategy. 
                // Since we just saved, 'selectedSellerData' might be stale regarding the update, OR 
                // we can rely on analyzeStrategy fetching fresh data via backend.
                // We'll try to find it in items or use selectedSellerData (which has the ID).

                let seller = selectedSellerData;
                if (!seller) {
                    seller = Object.values(items).flat().find(s => s.id === validationSellerId) as Seller | null;
                }

                if (seller) {
                    // Trigger the analysis flow. 
                    // IMPORTANT: analyzeStrategy needs to know validStage is pending to pass it to the dialog?
                    // No, passing pendingStage to analyzeStrategy might be needed if it wasn't there.
                    // But wait, analyzeStrategy(seller) usually doesn't take stage?
                    // Let's check analyzeStrategy signature.
                    analyzeStrategy(seller, pendingStage);
                    return;
                }
            }

            handleValidationSuccess();
            return;
        }

        // 2. AUTO-STRATEGY: If coming from Edit Mode AND Seller is in STRATEGY Stage (already)
        if (selectedSellerData && selectedSellerData.funnelStage === SellerFunnelStage.STRATEGY) {
            analyzeStrategy(selectedSellerData);
        }

        // Reset
        setSelectedSellerData(null);
        setSelectedSellerId("");
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveItem(null);
            return;
        }

        const itemId = active.id as string;
        const newStage = over.id as string;
        const itemData = active.data.current as KanbanItem;

        // --- VALIDATION: Seller Stage Gates ---
        if (type === "sellers" && itemData.type === "Seller") {
            const seller = itemData.item as Seller;

            // ALLOW: Always allow moving to CANCELLED
            if (newStage === SellerFunnelStage.CANCELLED) {
                onDragEnd(itemId, newStage);
                toast.success("Статус обновлен");
                setActiveItem(null);
                return;
            }

            // STRICT FUNNEL: Define Order
            const STAGE_ORDER = [
                SellerFunnelStage.CONTACT,
                SellerFunnelStage.INTERVIEW,
                SellerFunnelStage.STRATEGY,
                SellerFunnelStage.CONTRACT_SIGNING
            ];

            const currentIndex = STAGE_ORDER.indexOf(seller.funnelStage);
            const newIndex = STAGE_ORDER.indexOf(newStage as SellerFunnelStage);

            // 1. Block Backward Moves
            if (newIndex < currentIndex) {
                toast.error("Возврат на предыдущий этап запрещен");
                setActiveItem(null);
                return;
            }

            // 2. Block Skipping Stages (Must be sequential)
            // But verify if newIndex is valid (i.e., not -1 which would mean it's not in the main funnel, like CANCELLED, but we handled that above)
            if (newIndex !== -1 && newIndex > currentIndex + 1) {
                toast.error("Нельзя перепрыгивать этапы воронки");
                setActiveItem(null);
                return;
            }

            // GATE 1: To INTERVIEW (Progressive Data Entry)
            if (newStage === SellerFunnelStage.INTERVIEW) {
                // Check for required "Interview" fields (Reason, Deadline, Source, etc.)
                // If missing, open Edit Form
                const isComplete = seller.reason && seller.deadline && seller.source;

                if (!isComplete) {
                    toast.info("Для перехода на этап Интервью необходимо заполнить данные", {
                        description: "Заполните анкету продавца",
                        duration: 4000
                    });

                    // Set these states BEFORE opening form to ensure we know "why" we opened it
                    setValidationSellerId(seller.id);
                    setPendingStage(newStage);

                    // Open Edit Form
                    setSelectedSellerId(seller.id);
                    setSelectedSellerData(seller);
                    setIsSellerFormOpen(true);

                    // RESET drag immediately - do not allow staying in Interview without data
                    setActiveItem(null);
                    return;
                }
            }

            // GATE 2: To STRATEGY
            if (newStage === SellerFunnelStage.STRATEGY) {
                if (seller.funnelStage === SellerFunnelStage.STRATEGY) {
                    setActiveItem(null);
                    return;
                }

                // 1. Ensure Interview Data is present (Double Check)
                const missingFields = [];
                if (!seller.reason) missingFields.push("Причина продажи");
                if (!seller.deadline) missingFields.push("Срочность");
                if (!seller.source) missingFields.push("Источник");

                if (missingFields.length > 0) {
                    toast.warning("Для стратегии нужны данные", {
                        description: `Заполните: ${missingFields.join(", ")}`,
                        duration: 5000
                    });

                    // Interactive: Open Form to let user fix it immediately
                    setValidationSellerId(seller.id);
                    setPendingStage(newStage);

                    setSelectedSellerId(seller.id);
                    setSelectedSellerData(seller);
                    setIsSellerFormOpen(true);

                    setActiveItem(null);
                    return;
                }

                // 2. Check if property exists
                if (!seller.properties || seller.properties.length === 0) {
                    toast.error("Нельзя перейти к Стратегии без объекта", {
                        description: "Добавьте объект недвижимости в карточке продавца."
                    });
                    setActiveItem(null);
                    return;
                }

                // Trigger AI Strategy Calculation
                setActiveItem(null);
                analyzeStrategy(seller, newStage);
                return;
            }



            // GATE 3: To CONTRACT
            if (newStage === SellerFunnelStage.CONTRACT_SIGNING) {
                setValidationSellerId(seller.id);
                setPendingStage(newStage);
                setChecklistOpen(true);
                setActiveItem(null);
                return;
            }

            // Removed manual block logic since generic strict funnel covers it
        }

        // --- VALIDATION: Property Stage Gates ---
        if (type === "properties" && itemData.type === "Property") {
            const property = itemData.item as CrmProperty;

            // ALLOW: Always allow moving to CANCELLED
            if (newStage === PropertyFunnelStage.CANCELLED) {
                onDragEnd(itemId, newStage);
                toast.success("Статус обновлен");
                setActiveItem(null);
                return;
            }

            // GATE: To PREPARATION (Requires Photos)
            if (newStage === PropertyFunnelStage.PREPARATION) {
                const imgCount = property.images?.length || 0;
                if (imgCount < 3) {
                    setValidationSellerId(property.id); // Reusing ID state logic
                    setPendingStage(newStage);

                    setValidationPropertyId(property.id);
                    setCurrentImageCount(imgCount);
                    setMediaOpen(true);

                    setActiveItem(null);
                    return;
                }
            }
        }

        toast.success("Статус обновлен");
        onDragEnd(itemId, newStage);
        setActiveItem(null);
    };

    const handleValidationSuccess = () => {
        if (validationSellerId && pendingStage) {
            onDragEnd(validationSellerId, pendingStage);
            setValidationSellerId(null);
            setPendingStage(null);
        }
    };

    const handleStrategySuccess = async (strategyConfig: string) => {
        // Here we receive the chosen strategy code (e.g. 'MARKET_SALE')
        // We need to update the backend OR just proceed if the backend handles it via side-effect?
        // But we likely need to explicitly save the chosen strategy to the properties.

        // Since we don't have a direct "update seller strategy" endpoint that cascades, 
        // we will manually update each property of the seller.

        try {
            // We need to know which seller. 'validationSellerId' holds it.
            if (!validationSellerId) return;

            // Find the seller object to get properties
            // We can search in the 'items' prop
            let foundSeller: Seller | undefined;
            Object.values(items).forEach(list => {
                const s = (list as Seller[]).find(s => s.id === validationSellerId);
                if (s) foundSeller = s;
            });

            if (foundSeller && foundSeller.properties) {
                await Promise.all(foundSeller.properties.map(p =>
                    api.patch(`/crm-properties/${p.id}`, { activeStrategy: strategyConfig })
                ));
            }

            toast.success("Стратегия применена!");
            handleValidationSuccess(); // Proceed to move the card
            router.refresh();

        } catch (error) {
            console.error("Strategy save error", error);
            toast.error("Не удалось сохранить стратегию");
            setStrategyDialogOpen(false);
        }
    };

    // -------------------------------------

    // Refetch simulation seller when needed (e.g. after edit)
    // In a real app we'd use useQuery for the single seller, but here we can just rely on the list update or optimistic updates.
    // Ideally, we should fetch the specific seller if we want real-time updates in the sheet.
    // For now, let's just update the local state if we edit it via form? 
    // Actually, simply closing/opening form triggers refetch of list. We might need to listen to that.
    // Let's rely on React Query's cache if we passed an ID. 

    // BETTER: Use a query for the active simulation seller if ID exists
    // But to keep it simple within this file without too much refactor:
    // We will just update 'simulationSeller' when the list likely updates.
    // Or we can just let the user see the sheet, click edit, save, and closes.
    // The sheet might not update immediately if we don't refetch.

    // Let's leave it as is for now and focus on opening the forms.
    // -------------------------------------

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {type === "sellers" ? "Продавцы" : "Объекты"}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStrategiesSheetOpen(true)}
                        className="hidden md:flex gap-2"
                    >
                        <Target className="w-4 h-4 text-primary" />
                        Стратегии
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >

                <div className="flex gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
                    {columns.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            count={items[col.id]?.length || 0}
                            description={STAGE_DESCRIPTIONS[col.id]}
                        >
                            <SortableContext
                                items={items[col.id]?.map((i) => i.id) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-3 min-h-[50px]">
                                    {items[col.id]?.map((item) => (
                                        <div key={item.id}>
                                            {type === "sellers" ? (
                                                <SellerCard
                                                    seller={item as Seller}
                                                    onAddProperty={onAddProperty}
                                                    onInterviewClick={() => handleEditSeller(item as Seller)}
                                                    onDelete={(id) => deleteSellerMutation.mutate(id)}
                                                />
                                            ) : (
                                                <PropertyCard
                                                    property={item as CrmProperty}
                                                    onDelete={(id: string) => deletePropertyMutation.mutate(id)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </SortableContext>
                        </KanbanColumn>
                    ))}
                </div>

                {
                    typeof window !== "undefined" && createPortal(
                        <DragOverlay dropAnimation={null}>
                            {activeItem ? (
                                activeItem.type === "Seller" ? (
                                    <SellerCardBase seller={activeItem.item as Seller} isOverlay />
                                ) : (
                                    <PropertyCardBase property={activeItem.item as CrmProperty} isOverlay />
                                )
                            ) : null}
                        </DragOverlay>,
                        document.body
                    )
                }
            </DndContext >

            <MissingDataDialog
                open={missingDataOpen}
                onOpenChange={setMissingDataOpen}
                sellerId={validationSellerId || ""}
                mode={missingDataMode}
                properties={validationProperties}
                onSuccess={handleValidationSuccess}
            />

            <MediaGatewayDialog
                open={mediaOpen}
                onOpenChange={setMediaOpen}
                propertyId={validationPropertyId || ""}
                imageCount={currentImageCount}
                onSuccess={handleValidationSuccess}
            />

            <ChecklistDialog
                open={checklistOpen}
                onOpenChange={setChecklistOpen}
                title="Подписание Договора"
                items={[
                    "Договор подписан клиентом",
                    "Скан-копия загружена в систему",
                    "Оригинал получен в офис"
                ]}
                onSuccess={handleValidationSuccess}
            />

            <StrategySelectDialog
                open={strategyDialogOpen}
                onOpenChange={setStrategyDialogOpen}
                sellerId={validationSellerId || ""}
                onSuccess={handleStrategySuccess}
            />

            <AiStrategyConfirmDialog
                open={aiParams.open}
                onOpenChange={(v) => setAiParams(prev => ({ ...prev, open: v }))}
                strategyCode={aiParams.strategyCode}
                explanation={aiParams.explanation}
                onConfirm={() => {
                    setAiParams(prev => ({ ...prev, open: false }));
                    toast.success("Стратегия подтверждена!");
                    handleValidationSuccess(); // Proceed move
                    router.refresh();
                }}
                onChange={() => {
                    setAiParams(prev => ({ ...prev, open: false }));
                    setStrategyDialogOpen(true); // Open manual select
                }}
            />

            <StrategiesSheet
                open={strategiesSheetOpen}
                onOpenChange={setStrategiesSheetOpen}
            />

            {/* AI Magic Overlay */}
            {
                isAiAnalyzing && createPortal(
                    <StrategyLoader />,
                    document.body
                )
            }

            {/* Forms */}
            <CreateSellerForm
                open={isSellerFormOpen}
                onOpenChange={(v) => {
                    setIsSellerFormOpen(v);
                    if (!v) {
                        setSelectedSellerData(null); // Reset on close
                        setSelectedSellerId("");
                    }
                }}
                initialData={selectedSellerData}
                onSuccess={handleSellerFormSuccess}
            />

            <CreatePropertyForm
                open={isPropertyFormOpen}
                onOpenChange={setIsPropertyFormOpen}
                sellerId={selectedSellerId}
            />
        </div >
    );
}
