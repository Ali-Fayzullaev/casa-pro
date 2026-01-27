"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CrmProperty, Seller } from "@/types/kanban";
import { Building2, Wallet, Hammer, Brain, User, Calendar, MapPin, TrendingUp, AlertTriangle, MessageSquare, Home, Phone, Hash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterestTab } from "./InterestTab";
import { toast } from "sonner";
import {
    PropertyClassLabels,
    StrategyTypeLabels,
    FunnelStageLabels,
    RepairStateLabels,
    LiquidityLevelLabels
} from "@/lib/translations";

interface SummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Seller | CrmProperty;
    type: "Seller" | "Property";
}

export function SummaryDialog({ open, onOpenChange, data, type }: SummaryDialogProps) {
    if (!data) return null;

    // Type checking
    const isProperty = type === "Property";
    const property = isProperty ? (data as CrmProperty) : null;
    const simpleSeller = isProperty ? property?.seller : (data as Seller);
    const fullSeller = !isProperty ? (data as Seller) : null;

    // ... (keep helpers)
    const formatPrice = (p: string | number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(Number(p));
    const repairState = PropertyClassLabels[property?.repairState || ""] || property?.repairState || "Не указан";
    const ceilingHeight = property?.ceilingHeight || "—";
    const parkingType = property?.parkingType || "—";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                {isProperty ? property?.residentialComplex : `${simpleSeller?.firstName} ${simpleSeller?.lastName}`}
                                {isProperty && property?.calculatedClass && (
                                    <Badge variant="outline" className="ml-2 font-normal text-xs">
                                        {PropertyClassLabels[property.calculatedClass] || property.calculatedClass}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription className="mt-1 flex items-center gap-2">
                                {isProperty ? (
                                    <>
                                        <MapPin className="w-3 h-3" />
                                        {property?.address}
                                        {property?.aiRecommendation && (
                                            <Badge variant="destructive" className="ml-2 animate-pulse">
                                                AI: Советует смену стратегии
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Phone className="w-3 h-3" />
                                        {simpleSeller?.phone} • Доверие: <span className="font-bold text-primary">{simpleSeller?.trustLevel}/5</span>
                                    </>
                                )}
                            </DialogDescription>
                        </div>
                        {/* Badges */}
                        {isProperty && property?.activeStrategy && (
                            <Badge className="bg-indigo-600 hover:bg-indigo-700">
                                {StrategyTypeLabels[property.activeStrategy] || property.activeStrategy}
                            </Badge>
                        )}
                        {fullSeller && fullSeller.funnelStage && (
                            <Badge variant="secondary">
                                {FunnelStageLabels[fullSeller.funnelStage] || fullSeller.funnelStage}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-6 border-b">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                            <TabsTrigger
                                value="overview"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                Обзор
                            </TabsTrigger>
                            {isProperty && (
                                <TabsTrigger
                                    value="interest"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    Интерес (Показы)
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="overview" className="mt-0 space-y-6">
                            {/* ================= PROPERTY VIEW ================= */}
                            {isProperty && property && (
                                <>
                                    {/* AI RECOMMENDATION ALERT */}
                                    {property.aiRecommendation && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-900">
                                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                            <div>
                                                <div className="font-bold text-sm">Важная рекомендация AI</div>
                                                <p className="text-sm">{property.aiRecommendation}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI STRATEGY ANALYSIS */}
                                    {/* ... rest of original content ... */}
                                    {/* AI ANALYSIS */}
                                    {property.activeStrategy && (
                                        <div className="mb-6 rounded-xl border border-indigo-100 overflow-hidden bg-white shadow-sm">
                                            {/* Header / Verdict */}
                                            <div className="bg-gradient-to-r from-indigo-50 to-white p-4 border-b border-indigo-100 flex items-center gap-3">
                                                <div className="bg-indigo-100/50 p-2 rounded-lg">
                                                    <Brain className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                                                        AI Strategy Verdict
                                                    </div>
                                                    <div className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                                        {StrategyTypeLabels[property.activeStrategy] || property.activeStrategy}
                                                        {property.calculatedClass && (
                                                            <span className="text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                                {property.calculatedClass}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 space-y-5">
                                                {/* Loading State or Content */}
                                                {(() => {
                                                    if (!property.strategyExplanation) return (
                                                        <p className="text-sm text-muted-foreground italic">Обоснование еще не сгенерировано.</p>
                                                    );

                                                    let content: { reasoning: string; script: string } | null = null;
                                                    let rawText = property.strategyExplanation;
                                                    try {
                                                        if (rawText.trim().startsWith("{")) {
                                                            content = JSON.parse(rawText);
                                                        }
                                                    } catch (e) {
                                                        content = null;
                                                    }

                                                    if (content) {
                                                        return (
                                                            <>
                                                                <div>
                                                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                                                        <TrendingUp className="h-3 w-3" /> Почему выбрана эта стратегия?
                                                                    </h4>
                                                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                                                                        {content.reasoning}
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <h4 className="text-xs font-bold uppercase text-green-700/80 mb-2 flex items-center gap-1">
                                                                        <MessageSquare className="h-3 w-3" /> Скрипт для брокера
                                                                    </h4>
                                                                    <div className="bg-green-50/80 border border-green-100 rounded-lg p-4 relative">
                                                                        <div className="absolute top-3 left-3 text-green-300">
                                                                            <MessageSquare className="h-4 w-4 opacity-20" />
                                                                        </div>
                                                                        <p className="text-sm text-green-900 italic pl-2 border-l-2 border-green-300">
                                                                            "{content.script}"
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Анализ</h4>
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{rawText}</p>
                                                            </div>
                                                        )
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* INFO GRID */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                                    <Building2 className="h-3 w-3" /> Базовые данные
                                                </h4>
                                                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                                                    <dt className="text-muted-foreground">Площадь</dt>
                                                    <dd className="font-medium text-right">{property.area} м²</dd>
                                                    <dt className="text-muted-foreground">Этаж</dt>
                                                    <dd className="font-medium text-right">{property.floor}/{property.totalFloors}</dd>
                                                    <dt className="text-muted-foreground">Год</dt>
                                                    <dd className="font-medium text-right">{property.yearBuilt}</dd>
                                                </dl>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                                    <Hammer className="h-3 w-3" /> Характеристики
                                                </h4>
                                                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                                                    <dt className="text-muted-foreground">Ремонт</dt>
                                                    <dd className="font-medium text-right">{repairState}</dd>
                                                    <dt className="text-muted-foreground">Потолки</dt>
                                                    <dd className="font-medium text-right">{ceilingHeight} м</dd>
                                                    <dt className="text-muted-foreground">Паркинг</dt>
                                                    <dd className="font-medium text-right">{parkingType}</dd>
                                                </dl>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                                    <Wallet className="h-3 w-3" /> Финансы
                                                </h4>
                                                <div className="bg-green-50 rounded-md p-3 border border-green-100 mb-3">
                                                    <div className="text-xs text-green-700 mb-1">Желаемая цена</div>
                                                    <div className="text-lg font-bold text-green-800">{formatPrice(property.price)}</div>
                                                </div>
                                                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                                                    <dt className="text-muted-foreground">Ликвидность</dt>
                                                    <dd className={`font-medium text-right ${property.liquidityScore < 50 ? "text-orange-600" : ""}`}>
                                                        {LiquidityLevelLabels[property.liquidityLevel || ""] || property.liquidityLevel} ({property.liquidityScore}/100)
                                                    </dd>
                                                    <dt className="text-muted-foreground">Ипотека</dt>
                                                    <dd className="font-medium text-right">{property.financeType === 'CASH_ONLY' ? 'Только нал' : 'Доступна'}</dd>
                                                </dl>
                                            </div>
                                            {property.seller && (
                                                <div>
                                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                                        <User className="h-3 w-3" /> Продавец
                                                    </h4>
                                                    <div className="p-3 bg-gray-50 rounded-md border text-sm space-y-1">
                                                        <div className="font-medium">{property.seller.firstName} {property.seller.lastName}</div>
                                                        <div className="text-muted-foreground text-xs">{property.seller.phone}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ================= SELLER VIEW ================= */}
                            {fullSeller && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
                                            <div className="text-xs text-muted-foreground uppercase font-bold">Активных сделок</div>
                                            <div className="text-2xl font-bold">{fullSeller._count?.properties || 0}</div>
                                        </div>
                                        <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
                                            <div className="text-xs text-muted-foreground uppercase font-bold">Дата регистрации</div>
                                            <div className="text-sm font-medium">{new Date(fullSeller.updatedAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                            <Home className="w-4 h-4" /> Объекты продавца
                                        </h4>

                                        {fullSeller.properties && fullSeller.properties.length > 0 ? (
                                            <div className="space-y-3">
                                                {fullSeller.properties.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            // Close dialog (handled by parent usually) or navigate
                                                            // Since we are in a dialog, maybe we just want to switch the view to this property?
                                                            // For now, let's just close and maybe toast, or if we had a router push.
                                                            // Ideally, onOpenChange(false) and then open property. 
                                                            // But simpler: just log or toast for now until we have property detail route.
                                                            // UPDATE: User wants to "Go to objects".
                                                            onOpenChange(false);
                                                            // Assuming we have a way to filter or focus on property. 
                                                            // For now, let's reload with a query param or similar? 
                                                            // Or best, if we are in SPA, trigger a bus event.
                                                            // Let's just create a link if possible, or simple "Coming soon" navigation.
                                                            // Wait, in Kanban, we can just highlight it?
                                                            toast.info(`Переход к объекту ${p.residentialComplex}`);
                                                            // TODO: Implement actual navigation
                                                        }}
                                                        className="group flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-all hover:border-primary/50 cursor-pointer hover:bg-indigo-50/50"
                                                    >
                                                        <div>
                                                            <div className="font-medium text-indigo-900 group-hover:text-indigo-700">{p.residentialComplex}</div>
                                                            <div className="text-sm text-muted-foreground mt-1">
                                                                {formatPrice(p.price)}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {p.funnelStage}
                                                            </Badge>
                                                            {p.repairState && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {RepairStateLabels[p.repairState] || p.repairState}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-gray-50 border border-dashed rounded-lg">
                                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-3">
                                                    <Hash className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <p>У данного продавца пока нет объектов.</p>
                                            </div>
                                        )}
                                    </div>

                                    {fullSeller.managerComment && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Комментарий менеджера</h4>
                                            <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg text-sm text-yellow-900">
                                                {fullSeller.managerComment}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {isProperty && property && (
                            <TabsContent value="interest" className="mt-0">
                                <InterestTab propertyId={property.id} />
                            </TabsContent>
                        )}
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
