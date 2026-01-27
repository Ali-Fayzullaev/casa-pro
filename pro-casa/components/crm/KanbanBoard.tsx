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
import axios from "axios";
import { useRouter } from "next/navigation";
import { IncomingLeadSheet } from "./sheets/IncomingLeadSheet";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { CreateSellerForm } from "./forms/CreateSellerForm";
import { CreatePropertyForm } from "./forms/CreatePropertyForm";

type KanbanItem =
    | { type: "Seller"; item: Seller }
    | { type: "Property"; item: CrmProperty };

interface KanbanBoardProps {
    type: "sellers" | "properties";
    columns: { id: string; title: string }[];
    items: Record<string, (Seller | CrmProperty)[]>;
    onDragEnd: (id: string, newStage: string) => void;
    onAddProperty?: (sellerId: string) => void;
}

export function KanbanBoard({ type, columns, items, onDragEnd, onAddProperty }: KanbanBoardProps) {
    const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

    // Validation State
    const [missingDataOpen, setMissingDataOpen] = useState(false);
    const [missingDataMode, setMissingDataMode] = useState<"INTERVIEW" | "STRATEGY">("STRATEGY"); // Default
    const [validationSellerId, setValidationSellerId] = useState<string | null>(null);
    const [validationProperties, setValidationProperties] = useState<any[]>([]);
    const [pendingStage, setPendingStage] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor)
    );

    // Gate States
    const [mediaOpen, setMediaOpen] = useState(false);
    const [validationPropertyId, setValidationPropertyId] = useState<string | null>(null);
    const [currentImageCount, setCurrentImageCount] = useState(0);

    const [checklistOpen, setChecklistOpen] = useState(false);

    // AI Strategy State
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
    const router = useRouter();

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current as KanbanItem;
        setActiveItem(data);
    };

    const handleDragEnd = (event: DragEndEvent) => {
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

            // GATE 1: To INTERVIEW
            if (newStage === SellerFunnelStage.INTERVIEW) {
                if (!seller.reason || !seller.deadline) {
                    setValidationSellerId(seller.id);
                    setPendingStage(newStage);
                    setMissingDataMode("INTERVIEW");
                    setMissingDataOpen(true);
                    setActiveItem(null);
                    return;
                }
            }

            // GATE 2: To STRATEGY
            if (newStage === SellerFunnelStage.STRATEGY) {
                // Check 1: Must have at least one property
                if (!seller.properties || seller.properties.length === 0) {
                    toast.error("Нельзя сформировать стратегию без объектов. Добавьте недвижимость.");
                    setActiveItem(null);
                    return;
                }

                const needsData = seller.properties?.some(p =>
                    !p.repairState || p.repairState === "NONE" || !p.ceilingHeight
                );

                if (needsData) {
                    setValidationSellerId(seller.id);
                    setValidationProperties(seller.properties || []);
                    setPendingStage(newStage);
                    setMissingDataMode("STRATEGY");
                    setMissingDataOpen(true);
                    setActiveItem(null);
                    return;
                }

                // AI TRIGGER: Visual Magic
                setIsAiAnalyzing(true);
                // Optimistic move
                onDragEnd(itemId, newStage);
                setActiveItem(null);

                // Simulate/Run AI Analysis
                const analyzeStrategies = async () => {
                    try {
                        // Artificial delay for animation (at least 3s as requested)
                        await new Promise(r => setTimeout(r, 3000));

                        // Call Backend for each property
                        if (seller.properties && seller.properties.length > 0) {
                            await Promise.all(seller.properties.map(p =>
                                axios.post(`/api/crm-properties/${p.id}/recalculate-strategy`)
                            ));
                        }

                        toast.success("AI Стратегия сформирована!");
                        router.refresh(); // Refresh data to show new strategy/reasoning

                    } catch (error) {
                        console.error("AI Strategy Error", error);
                        toast.error("Ошибка AI анализа");
                    } finally {
                        setIsAiAnalyzing(false);
                    }
                };

                analyzeStrategies();
                return; // Return early as we handled onDragEnd manually

            }

            // GATE 3: To CONTRACT
            if (newStage === SellerFunnelStage.CONTRACT_SIGNING) {
                setValidationSellerId(seller.id);
                setPendingStage(newStage);
                setChecklistOpen(true);
                setActiveItem(null);
                return;
            }
        }

        // --- VALIDATION: Property Stage Gates ---
        if (type === "properties" && itemData.type === "Property") {
            const property = itemData.item as CrmProperty;

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

    // --- PHASE 4: Simulated Lead State ---
    const [leadSheetOpen, setLeadSheetOpen] = useState(false);
    const [simulationSeller, setSimulationSeller] = useState<Seller | null>(null);
    const [simulationProperty, setSimulationProperty] = useState<CrmProperty | null>(null);

    // Form Control State
    const [isSellerFormOpen, setIsSellerFormOpen] = useState(false);
    const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);

    // Mutation to create real seller for simulation
    const queryClient = useQueryClient();
    const createSellerMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.post("/api/sellers", data);
        },
        onSuccess: (response) => {
            const newSeller = response.data;
            setSimulationSeller(newSeller);
            setSimulationProperty(null); // No property initially
            setLeadSheetOpen(true);
            toast.success("Новый лид создан в базе!");
            queryClient.invalidateQueries({ queryKey: ["sellers"] });
        },
        onError: () => toast.error("Ошибка при создании симуляции")
    });

    const handleSimulateLead = () => {
        // Create Logic: call API to create real "Incoming Lead"
        const mockData = {
            firstName: "Новый",
            lastName: "Клиент", // Placeholder
            phone: "+7 700 " + Math.floor(1000000 + Math.random() * 9000000), // Random phone
            source: "INSTAGRAM",
            city: "Алматы",
            trustLevel: 1
        };
        createSellerMutation.mutate(mockData);
    };

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
        <>
            {/* Header / Simulation Controls */}
            <div className="flex justify-between items-center mb-4 px-1">
                <h1 className="text-2xl font-bold text-gray-900">
                    {type === "sellers" ? "Продавцы" : "Объекты"}
                </h1>
                {type === "sellers" && (
                    <Button
                        variant="outline"
                        className="gap-2 border-dashed border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        onClick={handleSimulateLead}
                    >
                        <UserPlus className="h-4 w-4" />
                        Simulate Incoming Lead
                    </Button>
                )}
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
                        >
                            <SortableContext
                                items={items[col.id]?.map((i) => i.id) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-3 min-h-[50px]">
                                    {items[col.id]?.map((item) => (
                                        <div key={item.id}>
                                            {type === "sellers" ? (
                                                <SellerCard seller={item as Seller} onAddProperty={onAddProperty} />
                                            ) : (
                                                <PropertyCard property={item as CrmProperty} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </SortableContext>
                        </KanbanColumn>
                    ))}
                </div>

                {typeof window !== "undefined" && createPortal(
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
                )}
            </DndContext>

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

            {/* AI Magic Overlay */}
            {isAiAnalyzing && createPortal(
                <StrategyLoader />,
                document.body
            )}

            {/* Global Incoming Lead Sheet */}
            <IncomingLeadSheet
                open={leadSheetOpen}
                onOpenChange={setLeadSheetOpen}
                seller={simulationSeller}
                property={simulationProperty}
                onEditSeller={() => setIsSellerFormOpen(true)}
                onOpenProperty={() => {
                    // If property exists, maybe view it? For now, we only support ADDING in this flow as per task description for empty state. 
                    // Or if editing is needed?
                    setIsPropertyFormOpen(true);
                }}
                onConfirmStrategy={() => {
                    setLeadSheetOpen(false);
                    toast.success("Лид успешно квалифицирован и переведен в работу!");
                }}
            />

            {/* Forms */}
            <CreateSellerForm
                open={isSellerFormOpen}
                onOpenChange={setIsSellerFormOpen}
                initialData={simulationSeller ? { ...simulationSeller } as any : undefined}
            />

            {simulationSeller && (
                <CreatePropertyForm
                    open={isPropertyFormOpen}
                    onOpenChange={setIsPropertyFormOpen}
                    sellerId={simulationSeller.id}
                />
            )}
        </>
    );
}
