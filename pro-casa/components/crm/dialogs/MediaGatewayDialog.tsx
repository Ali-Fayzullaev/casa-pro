"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface MediaGatewayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyId: string;
    imageCount: number;
    requiredCount?: number;
    onSuccess: () => void;
}

export function MediaGatewayDialog({
    open,
    onOpenChange,
    propertyId,
    imageCount,
    requiredCount = 3,
    onSuccess,
}: MediaGatewayDialogProps) {
    const [currentCount, setCurrentCount] = useState(imageCount);

    const handleContinue = () => {
        if (currentCount < requiredCount) {
            toast.error(`Необходимо минимум ${requiredCount} фото`);
            return;
        }
        onSuccess();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        Подготовка Объекта
                    </DialogTitle>
                    <DialogDescription>
                        Для перехода на этап "Подготовка" необходимо загрузить качественные фото (минимум {requiredCount}).
                        <br />
                        Сейчас загружено: <b>{currentCount}</b>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {/* Hack to force refresh count - in real app we'd use query invalidation or callback from uploader */}
                    <div className="text-xs text-muted-foreground mb-2 text-center">
                        Загрузите фото ниже.
                    </div>

                    <ImageUploader propertyId={propertyId} />
                </div>

                <DialogFooter className="flex row justify-between sm:justify-between items-center">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                        Отмена
                    </Button>
                    <Button onClick={handleContinue} className="bg-amber-600 hover:bg-amber-700 text-white">
                        Готово, продолжить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
