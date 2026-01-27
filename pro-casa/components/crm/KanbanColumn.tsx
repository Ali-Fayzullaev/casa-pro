import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    count?: number;
    children: React.ReactNode;
}

export function KanbanColumn({ id, title, count = 0, children }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[300px]">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-wide">
                    {title}
                </h3>
                <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {count}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 bg-muted/40 rounded-xl p-2 border-2 border-transparent transition-colors overflow-y-auto space-y-3",
                    isOver && "border-primary/20 bg-primary/5"
                )}
            >
                {children}
            </div>
        </div>
    );
}
