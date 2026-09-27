"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface AssetInputProps {
    label: string;
    description?: string;
    value: string;
    onChange: (url: string) => void;
    name: string;
}

export function AssetInput({
    label,
    description,
    value,
    onChange,
    name,
}: AssetInputProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setUploadError(data.error || "Erro no upload do arquivo.");
            } else if (data.url) {
                onChange(data.url);
            }
        } catch {
            setUploadError("Falha de conexao ao enviar arquivo.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label
                    htmlFor={name}
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                    {label}
                </label>
                {description && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {description}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2.5">
                {/* Preview em Miniatura */}
                <div className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-1">
                    {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={value}
                            alt={label}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display =
                                    "none";
                            }}
                        />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-zinc-400" />
                    )}
                </div>

                {/* Campo de URL */}
                <div className="relative flex-1">
                    <input
                        id={name}
                        name={name}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="https://... ou caminho /uploads/..."
                        className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            title="Limpar campo"
                            aria-label="Limpar campo"
                            className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Botao de Upload de Arquivo */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    title="Fazer upload de PNG ou SVG"
                    aria-label={`Upload de arquivo para ${label}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>Upload</span>
                </button>
            </div>

            {uploadError && (
                <p className="text-[11px] text-red-600 dark:text-red-400">
                    {uploadError}
                </p>
            )}
        </div>
    );
}
