"use client";

import React, { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Folder, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista curada de nomes de icones populares para classificacao tematica de vitrine
export const POPULAR_CATEGORY_ICONS = [
    "Laptop",
    "Smartphone",
    "Headphones",
    "Tv",
    "Camera",
    "Watch",
    "Shirt",
    "Sparkles",
    "Home",
    "Utensils",
    "Coffee",
    "Dumbbell",
    "Gamepad2",
    "Book",
    "Car",
    "Gift",
    "Tag",
    "ShoppingBag",
    "Heart",
    "Palette",
    "Music",
    "Scissors",
    "Shield",
    "Star",
    "Zap",
    "Flame",
    "Baby",
    "Truck",
    "Wrench",
    "Briefcase",
    "Glasses",
    "Footprints",
    "Smile",
    "Compass",
    "Feather",
    "Sun",
    "Flower2",
] as const;

interface DynamicCategoryIconProps {
    name?: string | null;
    className?: string;
}

/**
 * Renderizador dinamico seguro de icones da Lucide React com fallback gracioso.
 */
export function DynamicCategoryIcon({
    name,
    className = "h-4 w-4",
}: DynamicCategoryIconProps) {
    if (!name || name.trim() === "") {
        return <Folder className={className} aria-hidden="true" />;
    }

    // Normalizacao: converte formatos como "gamepad-2" ou "gamepad_2" para PascalCase "Gamepad2"
    const normalizedName = name
        .trim()
        .split(/[-_]/)
        .map(
            (part) =>
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join("");

    const iconsMap = LucideIcons as unknown as Record<
        string,
        React.ComponentType<{ className?: string }>
    >;
    const IconComponent = iconsMap[normalizedName] || iconsMap[name] || Folder;

    return <IconComponent className={className} aria-hidden="true" />;
}

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [search, setSearch] = useState("");

    const filteredIcons = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return POPULAR_CATEGORY_ICONS;
        return POPULAR_CATEGORY_ICONS.filter((icon) =>
            icon.toLowerCase().includes(query),
        );
    }, [search]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Icone Representativo
                </label>
                {value && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Selecionado:</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                            <DynamicCategoryIcon
                                name={value}
                                className="h-3 w-3"
                            />
                            {value}
                        </span>
                    </div>
                )}
            </div>

            {/* Campo de Busca de Icones */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar icones (ex: Laptop, Shirt, Home)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
            </div>

            {/* Grade de Icones */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                {filteredIcons.map((iconName) => {
                    const isSelected =
                        value.toLowerCase() === iconName.toLowerCase();
                    return (
                        <button
                            key={iconName}
                            type="button"
                            onClick={() => onChange(iconName.toLowerCase())}
                            title={iconName}
                            aria-label={`Selecionar icone ${iconName}`}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-md transition-colors cursor-pointer",
                                isSelected
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
                            )}
                        >
                            <DynamicCategoryIcon
                                name={iconName}
                                className="h-4 w-4"
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
