"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileText, Loader2, File, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api-client";
import { toast } from "sonner";

interface FileUploaderProps {
    propertyId: string;
    files?: string[];
    onFilesChange?: (urls: string[]) => void;
}

export function FileUploader({ propertyId, files = [], onFilesChange }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [localFiles, setLocalFiles] = useState<string[]>(files);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of acceptedFiles) {
                const formData = new FormData();
                formData.append("file", file);

                const res = await api.post(`/uploads/property/${propertyId}/documents`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (res.data.url) {
                    newUrls.push(res.data.url);
                }
            }

            const updatedList = [...localFiles, ...newUrls];
            setLocalFiles(updatedList);
            onFilesChange?.(updatedList);
            toast.success(`Загружено ${newUrls.length} файлов`);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Ошибка загрузки");
        } finally {
            setUploading(false);
        }
    }, [propertyId, localFiles, onFilesChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': [],
            'application/msword': [],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
        },
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const handleDelete = async (urlToDelete: string) => {
        try {
            const filtered = localFiles.filter(url => url !== urlToDelete);
            setLocalFiles(filtered);
            onFilesChange?.(filtered);

            await api.delete(`/uploads/property/${propertyId}/documents`, {
                data: { url: urlToDelete }
            });
            toast.success("Файл удален");
        } catch (error) {
            toast.error("Ошибка удаления");
        }
    };

    const getFileName = (url: string) => {
        try {
            // Decoding filename from URL usually stored as timestamp-name
            const parts = url.split('/');
            const fullName = parts[parts.length - 1];
            // Remove timestamp prefix if possible (optional)
            // stored as: properties/{id}/docs/{timestamp}-{name}
            const nameParts = fullName.split('-');
            if (nameParts.length > 1 && /^\d+$/.test(nameParts[0])) {
                return nameParts.slice(1).join('-');
            }
            return fullName;
        } catch (e) {
            return "Document";
        }
    };

    return (
        <div className="space-y-4">
            {/* DROPZONE */}
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors bg-white",
                    isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50",
                    uploading && "opacity-50 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    ) : (
                        <FileText className="h-8 w-8 text-gray-400" />
                    )}
                    {uploading ? (
                        <p className="text-sm">Загрузка...</p>
                    ) : (
                        <div className="text-sm">
                            <span className="font-semibold text-indigo-600">Загрузить документы</span>
                            <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (до 10MB)</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FILES LIST */}
            {localFiles.length > 0 && (
                <div className="space-y-2">
                    {localFiles.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border rounded-md group hover:bg-white hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white rounded-md border text-indigo-600">
                                    <Paperclip className="w-4 h-4" />
                                </div>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 truncate hover:underline hover:text-indigo-600">
                                    {getFileName(url)}
                                </a>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                onClick={() => handleDelete(url)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
