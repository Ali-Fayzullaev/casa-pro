import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Star, FileText, Plus } from "lucide-react";
import { Seller } from "@/types/kanban";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SellerCardProps {
    seller: Seller;
    onInterviewClick?: (id: string) => void;
    onAddProperty?: (id: string) => void;
}

import { defaultAnimateLayoutChanges } from "@dnd-kit/sortable";

import { useState } from "react";
import { Eye } from "lucide-react";
import { SummaryDialog } from "./dialogs/SummaryDialog";
import { DeadlineLabels, FunnelStageLabels } from "@/lib/translations";

export function SellerCardBase({ seller, onInterviewClick, onAddProperty, style, setNodeRef, attributes, listeners, isDragging, isOverlay }: any) {
    const [summaryOpen, setSummaryOpen] = useState(false);

    const trustLevelColor =
        seller.trustLevel >= 4
            ? "text-yellow-500"
            : seller.trustLevel >= 3
                ? "text-blue-500"
                : "text-gray-400";

    return (
        <>
            <Card
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={`mb-3 cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing border-l-4 group ${seller.trustLevel >= 4 ? "border-l-yellow-400" : "border-l-blue-400"} ${isOverlay ? "shadow-xl scale-105 rotate-2 cursor-grabbing" : ""} ${isDragging ? "opacity-50" : ""}`}
            >
                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-y-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {seller.firstName[0]}
                                {seller.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="text-sm font-semibold leading-none">
                                {seller.firstName} {seller.lastName}
                            </h4>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {seller.phone}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`h-3 w-3 ${i < seller.trustLevel ? trustLevelColor : "text-gray-200"
                                    } fill-current`}
                            />
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                    {/* Status Badge */}
                    <div className="mb-3">
                        {seller.deadline ? (
                            <Badge variant="destructive" className="h-5 text-[10px] px-2 w-full justify-center">
                                🔥 Срочно: {DeadlineLabels[seller.deadline] || seller.deadline}
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="h-5 text-[10px] px-2 w-full justify-center text-muted-foreground bg-gray-100">
                                💤 Пассивный
                            </Badge>
                        )}
                    </div>

                    {/* Properties List */}
                    {seller.properties && seller.properties.length > 0 ? (
                        <div className="space-y-1.5 mb-3">
                            {seller.properties.slice(0, 3).map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between text-[10px] bg-gray-50 p-1.5 rounded border">
                                    <span className="font-medium truncate max-w-[100px]" title={p.residentialComplex}>
                                        {p.residentialComplex}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                            {p.showsCount > 0 && (
                                                <span className="flex items-center" title="Показы">
                                                    <Eye className="h-3 w-3 mr-0.5" /> {p.showsCount}
                                                </span>
                                            )}
                                            {p.leadsCount > 0 && (
                                                <span className="flex items-center font-bold text-blue-600" title="Офферы">
                                                    <FileText className="h-3 w-3 mr-0.5" /> {p.leadsCount}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-white">
                                            {FunnelStageLabels[p.funnelStage] || p.funnelStage}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {seller.properties.length > 3 && (
                                <div className="text-[10px] text-center text-muted-foreground">
                                    еще +{seller.properties.length - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-[10px] text-muted-foreground text-center py-2 border border-dashed rounded mb-3">
                            Нет объектов
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-2">
                        <div className="text-[10px] text-muted-foreground">
                            Всего: {seller._count?.properties || 0}
                        </div>

                        <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                onClick={() => setSummaryOpen(true)}
                                title="Подробнее"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => onAddProperty?.(seller.id)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Объект
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <SummaryDialog
                open={summaryOpen}
                onOpenChange={setSummaryOpen}
                data={seller}
                type="Seller"
            />
        </>
    )
}

export function SellerCard(props: SellerCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props.seller.id,
        data: { type: "Seller", item: props.seller },
        animateLayoutChanges: (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <SellerCardBase
            {...props}
            style={style}
            setNodeRef={setNodeRef}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
        />
    );
}
