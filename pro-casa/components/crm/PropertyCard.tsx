import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, TrendingUp, HandCoins } from "lucide-react";
import { CrmProperty, PropertyClass, StrategyType } from "@/types/kanban";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
    property: CrmProperty;
}

const CLASS_COLORS: Record<PropertyClass, string> = {
    BUSINESS: "bg-purple-100 text-purple-700 border-purple-200",
    COMFORT_PLUS: "bg-blue-100 text-blue-700 border-blue-200",
    COMFORT: "bg-cyan-100 text-cyan-700 border-cyan-200",
    ECONOMY: "bg-gray-100 text-gray-700 border-gray-200",
    OLD_FUND: "bg-amber-100 text-amber-700 border-amber-200",
};

import { PropertyClassLabels, StrategyTypeLabels } from "@/lib/translations";

import { defaultAnimateLayoutChanges } from "@dnd-kit/sortable";

import { useState } from "react";
import { Sparkles, Loader2, FileText, Eye, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { SummaryDialog } from "./dialogs/SummaryDialog";
import { StrategyLoader } from "@/components/ui/StrategyLoader";

export function PropertyCardBase({ property, style, setNodeRef, attributes, listeners, isDragging, isOverlay }: { property: CrmProperty; style?: any; setNodeRef?: any; attributes?: any; listeners?: any; isDragging?: boolean; isOverlay?: boolean }) {
    const queryClient = useQueryClient();
    const [isGenerating, setIsGenerating] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isCritical =
        property.activeStrategy === StrategyType.REJECT_OBJECT ||
        property.activeStrategy === StrategyType.LOW_LIQUIDITY;

    const priceFormatted = new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "KZT",
        maximumFractionDigits: 0,
    }).format(Number(property.price));

    const handleGenerateStrategy = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card drag/click
        e.preventDefault();

        if (isGenerating) return;

        setIsGenerating(true);
        // Toast is now handled visually by the loader, but we can keep a start toast if desired
        // toast.info("AI анализирует объект...");

        // Artifical delay for "Thinking" effect (3.5s)
        const delayPromise = new Promise(resolve => setTimeout(resolve, 3500));

        try {
            const requestPromise = api.post(`/crm-properties/${property.id}/recalculate-strategy`);

            // Wait for both delay and request
            await Promise.all([delayPromise, requestPromise]);

            toast.success("Стратегия обоснована!");
            queryClient.invalidateQueries({ queryKey: ["crm-properties"] });
        } catch (error) {
            toast.error("Ошибка генерации стратегии");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Card
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "mb-3 cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing border-l-4 group relative overflow-hidden", // Added overflow-hidden for loader
                    isCritical ? "border-l-destructive border-destructive/50" : "border-l-primary/50",
                    isOverlay ? "shadow-xl scale-105 rotate-2 cursor-grabbing" : "",
                    isDragging ? "opacity-50" : ""
                )}
            >
                {/* AI LOADER OVERLAY */}
                {isGenerating && <StrategyLoader />}

                <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start mb-1">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[10px] px-1.5 py-0 border font-medium",
                                property.calculatedClass
                                    ? CLASS_COLORS[property.calculatedClass]
                                    : "bg-gray-100"
                            )}
                        >
                            {PropertyClassLabels[property.calculatedClass || ""] || property.calculatedClass || "Не определен"}
                        </Badge>

                        {property.activeStrategy && (
                            <div className="flex items-center gap-1">
                                <Badge
                                    variant={isCritical ? "destructive" : "secondary"}
                                    className={cn("text-[10px] h-5 transition-all duration-500", !isGenerating && "animate-in fade-in zoom-in")} // Animate badge appearance
                                >
                                    {StrategyTypeLabels[property.activeStrategy] || property.activeStrategy}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <h4 className="text-sm font-semibold line-clamp-2 leading-tight" title={property.residentialComplex}>
                        {property.residentialComplex}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate" title={property.address}>
                        {property.address}
                    </p>
                </CardHeader>

                <CardContent className="p-3 pt-2">
                    {/* COVER IMAGE */}
                    {property.images && property.images.length > 0 && !imgError ? (
                        <div className="mb-2 -mx-3 -mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={property.images[0]}
                                alt="Cover"
                                className="w-full h-32 object-cover"
                                onError={() => setImgError(true)}
                            />
                        </div>
                    ) : (property.images && property.images.length > 0 && imgError) && (
                        <div className="mb-2 -mx-3 -mt-2 h-32 bg-gray-50 flex items-center justify-center border-b">
                            <ImageOff className="h-8 w-8 text-gray-300" />
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                        <span className="text-primary">{priceFormatted}</span>
                        <span className="text-muted-foreground">{property.area} м²</span>
                    </div>

                    {/* Индикаторы */}
                    <div className="flex gap-2 pt-2 border-t mt-2 items-center justify-between">
                        <div className="flex gap-2">
                            {property.liquidityScore < 50 && (
                                <div className="flex items-center gap-1 text-[10px] text-orange-600" title="Низкая ликвидность">
                                    <TrendingUp className="h-3 w-3 rotate-180" />
                                    <span>{property.liquidityScore}</span>
                                </div>
                            )}

                            {isCritical && (
                                <div className="flex items-center gap-1 text-[10px] text-destructive font-semibold">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Риск</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 z-20" onPointerDown={(e) => e.stopPropagation()}>
                            {/* Eye Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => setSummaryOpen(true)}
                                title="Подробнее"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* AI Button */}
                            {property.activeStrategy && (
                                property.strategyExplanation ? (
                                    <div className="text-green-600 flex items-center px-1" title="Обоснование готово">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        onClick={handleGenerateStrategy}
                                        disabled={isGenerating}
                                        title="Сгенерировать обоснование AI"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                                        ) : (
                                            <Sparkles className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>

                    {property.seller && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <HandCoins className="h-3 w-3" />
                            <span>{property.seller.firstName} {property.seller.lastName}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <SummaryDialog
                open={summaryOpen}
                onOpenChange={setSummaryOpen}
                data={property}
                type="Property"
            />
        </>
    );
}

export function PropertyCard({ property }: PropertyCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: property.id,
        data: { type: "Property", item: property },
        animateLayoutChanges: (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <PropertyCardBase
            property={property}
            style={style}
            setNodeRef={setNodeRef}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
        />
    );
}
