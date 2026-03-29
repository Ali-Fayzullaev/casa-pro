import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface KanbanColumnProps {
    id: string;
    title: string;
    count?: number;
    description?: string;
    children: React.ReactNode;
    variant?: "blue" | "pink" | "green" | "cyan" | "default";
    color?: string;
}

const VARIANT_HEADER: Record<string, string> = {
    blue: "bg-blue-600 text-white",
    pink: "bg-rose-500 text-white",
    green: "bg-emerald-600 text-white",
    cyan: "bg-cyan-500 text-white",
    default: "bg-gray-700 text-white",
};

const VARIANT_BG: Record<string, string> = {
    blue: "bg-blue-50",
    pink: "bg-rose-50",
    green: "bg-emerald-50",
    cyan: "bg-cyan-50",
    default: "bg-gray-50",
};

export function KanbanColumn({ id, title, count = 0, description, children, variant = "default", color }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    const headerStyle = color
        ? { backgroundColor: color, color: "white" }
        : undefined;

    const bgClass = color ? "bg-gray-50" : (VARIANT_BG[variant] || VARIANT_BG.default);

    return (
        <div className={cn(
            "flex flex-col rounded-xl shrink-0 w-[272px]",
            bgClass,
            isOver && "ring-2 ring-primary/40"
        )}>
            {/* Header — fixed */}
            <div
                className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-t-xl text-sm font-semibold shrink-0",
                    !color && (VARIANT_HEADER[variant] || VARIANT_HEADER.default)
                )}
                style={headerStyle}
            >
                <div className="flex items-center gap-1.5">
                    <span className="uppercase tracking-wide text-xs">{title}</span>
                    {description && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3 h-3 opacity-70 hover:opacity-100" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                                    {description}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <span className="bg-white/20 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {count}
                </span>
            </div>

            {/* Cards — scrollable, hidden scrollbar */}
            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px] scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {isOver && (
                    <div className="h-12 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center animate-in fade-in">
                        <span className="text-xs text-muted-foreground">Отпустите здесь</span>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
