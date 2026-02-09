import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    count?: number;
    children: React.ReactNode;
}

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

const VARIANTS = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20",
    pink: "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/20",
    green: "bg-gradient-to-br from-lime-500 to-green-600 text-white shadow-green-500/20",
    cyan: "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-500/20",
    default: "bg-secondary/50 text-secondary-foreground"
};

export function KanbanColumn({ id, title, count = 0, description, children, variant = "default", color }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    const customStyle = color ? {
        background: `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`,
        color: 'white',
        boxShadow: `0 4px 6px -1px ${color}33`,
    } : undefined;

    return (
        <div className="flex flex-col h-full min-w-[300px] w-[300px] border-r border-border/20 last:border-r-0 mr-4">
            <div
                className={cn(
                    "flex items-center justify-between mb-4 px-4 py-3 rounded-xl shadow-lg transition-all",
                    !color && (VARIANTS[variant] || VARIANTS.default)
                )}
                style={customStyle}
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm uppercase tracking-wide">
                        {title}
                    </h3>
                    {description && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3.5 h-3.5 opacity-70 hover:opacity-100 transition-opacity cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[200px] text-xs bg-black/90 text-white border-0">
                                    {description}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <span className="bg-white/20 backdrop-blur-md text-inherit text-xs font-bold px-2 py-0.5 rounded-full border border-white/10">
                    {count}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-xl p-2 transition-all overflow-y-auto space-y-3",
                    isOver ? "bg-primary/5 ring-2 ring-primary/20" : "hover:bg-accent/5"
                )}
            >
                {/* Drop placeholder when dragging over */}
                {isOver && (
                    <div className="h-16 mb-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center transition-all animate-in fade-in duration-200">
                        <span className="text-xs text-muted-foreground">Отпустите здесь</span>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
