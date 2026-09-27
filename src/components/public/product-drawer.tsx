"use client";

import React, { useState } from "react";
import { ChevronUp, ShoppingBag, X } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/types/database";

interface ProductDrawerProps {
    products: Product[];
    videoId?: string;
    className?: string;
}

export function ProductDrawer({
    products,
    videoId,
    className = "",
}: ProductDrawerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (!products || products.length === 0) {
        return null;
    }

    const currentProduct = products[selectedIndex] || products[0];

    return (
        <div className={`relative w-full ${className}`}>
            {/* Modo Recolhido: Barra Compacta Flutuante */}
            {!isExpanded && (
                <div className="relative">
                    <ProductCard
                        product={currentProduct}
                        videoId={videoId}
                        compact
                    />

                    {/* Botao de expansao / alternancia de produtos */}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(true)}
                        className="mt-1 flex w-full items-center justify-between rounded-lg bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-black/80"
                    >
                        <div className="flex items-center gap-1.5">
                            <ShoppingBag className="h-3 w-3 text-brand-primary" />
                            <span>
                                {products.length > 1
                                    ? `${products.length} produtos recomendados neste corte`
                                    : "Ver detalhes completos"}
                            </span>
                        </div>
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Modo Expandido: Gaveta Completa (Bottom Sheet) */}
            {isExpanded && (
                <div className="rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/95 animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-brand-primary" />
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                Produtos Recomendados ({products.length})
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            aria-label="Fechar gaveta de produtos"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Seletor quando houver multiplos produtos */}
                    {products.length > 1 && (
                        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {products.map((p, idx) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                        selectedIndex === idx
                                            ? "bg-brand-primary text-white"
                                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    Opcao {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-3">
                        <ProductCard
                            product={currentProduct}
                            videoId={videoId}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
