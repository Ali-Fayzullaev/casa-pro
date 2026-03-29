"use client";

import * as React from "react";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DateFilterProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export function DateFilter({ date, setDate }: DateFilterProps) {
    const [activePreset, setActivePreset] = React.useState<string>("all");

    const presets = [
        { key: "all", label: "Все" },
        { key: "today", label: "Сегодня" },
        { key: "week", label: "Неделя" },
        { key: "month", label: "Месяц" },
    ];

    const handlePreset = (key: string) => {
        setActivePreset(key);
        const now = new Date();
        switch (key) {
            case "today": setDate(startOfDay(now)); break;
            case "week": setDate(startOfWeek(now, { weekStartsOn: 1 })); break;
            case "month": setDate(startOfMonth(now)); break;
            default: setDate(undefined);
        }
    };

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            setDate(new Date(e.target.value));
            setActivePreset("custom");
        }
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex bg-muted rounded-md p-0.5">
                {presets.map((p) => (
                    <Button
                        key={p.key}
                        variant={activePreset === p.key ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => handlePreset(p.key)}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={activePreset === "custom" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2"
                    >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {activePreset === "custom" && date && (
                            <span className="ml-1 text-xs">{format(date, "dd.MM", { locale: ru })}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                    <input
                        type="date"
                        className="border rounded px-2 py-1 text-sm"
                        value={date ? format(date, "yyyy-MM-dd") : ""}
                        onChange={handleDateInput}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
