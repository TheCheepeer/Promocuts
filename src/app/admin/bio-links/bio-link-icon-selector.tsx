"use client";

import React, { useState, useMemo, memo } from "react";
import { Search, Sparkles } from "lucide-react";
import { BIO_LINK_AVAILABLE_ICONS, BioLinkIcon } from "./bio-link-icons";

interface BioLinkIconSelectorProps {
    selectedIcon: string;
    onSelectIcon: (iconId: string) => void;
}

const CATEGORY_TABS = [
    { id: "all", label: "Todas" },
    { id: "video", label: "Vídeo & Lives" },
    { id: "social", label: "Redes Sociais" },
    { id: "community", label: "Comunidades" },
    { id: "audio", label: "Áudio & Música" },
    { id: "monetization", label: "Apoio & Doações" },
    { id: "other", label: "Outros" },
] as const;

export const BioLinkIconSelector = memo(function BioLinkIconSelector({
    selectedIcon,
    onSelectIcon,
}: BioLinkIconSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("all");

    const filteredIcons = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return BIO_LINK_AVAILABLE_ICONS.filter((opt) => {
            const matchesQuery =
                !query ||
                opt.label.toLowerCase().includes(query) ||
                opt.id.toLowerCase().includes(query);

            const matchesCategory =
                activeTab === "all" ||
                (activeTab === "video" &&
                    (opt.category === "video" || opt.category === "streaming")) ||
                opt.category === activeTab;

            return matchesQuery && matchesCategory;
        });
    }, [searchQuery, activeTab]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    Plataforma / Ícone
                </label>
                <span className="text-[11px] text-zinc-400">
                    {filteredIcons.length} disponíveis
                </span>
            </div>

            {/* Barra de Busca e Filtro Rápido */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar plataforma (ex: Reddit, Spotify, Twitch...)"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
            </div>

            {/* Abas de Categorias */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                {CATEGORY_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                            activeTab === tab.id
                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grade de Ícones com Scroll Otimizado */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1.5 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                {filteredIcons.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-xs text-zinc-400">
                        Nenhuma plataforma encontrada para &quot;{searchQuery}&quot;.
                    </div>
                ) : (
                    filteredIcons.map((opt) => {
                        const isSelected = selectedIcon === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => onSelectIcon(opt.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                                    isSelected
                                        ? "bg-white shadow-xs border border-zinc-300 font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white ring-1 ring-zinc-400 dark:ring-zinc-600"
                                        : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
                                }`}
                            >
                                <div
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-2xs"
                                    style={{ backgroundColor: opt.brandColor }}
                                >
                                    <BioLinkIcon name={opt.id} className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate flex-1">{opt.label}</span>
                                {isSelected && (
                                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
});
