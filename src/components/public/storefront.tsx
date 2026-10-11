"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CategoryPills } from "./category-pills";
import { Feed } from "./feed";
import type { Category } from "@/types/database";
import type { VideoWithRelations } from "./feed-mobile";

interface StorefrontProps {
    categories: Category[];
    allVideos: VideoWithRelations[];
    initialActiveSlug?: string | null;
}

/**
 * Componente orquestrador da vitrine publica.
 * Permite alternancia instantanea (0ms) entre categorias com filtragem em memoria,
 * feedback tatil imediato e sincronizacao transparente do historico de navegacao.
 */
export function Storefront({
    categories,
    allVideos,
    initialActiveSlug = null,
}: StorefrontProps) {
    const [activeSlug, setActiveSlug] = useState<string | null>(initialActiveSlug);

    // Sincroniza o estado caso o usuario navegue com o historico do navegador (Voltar / Avancar)
    useEffect(() => {
        const handlePopState = () => {
            const pathname = window.location.pathname;
            const match = pathname.match(/^\/c\/([^\/]+)/);
            if (match) {
                setActiveSlug(match[1]);
            } else {
                setActiveSlug(null);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Atualiza o estado caso a prop initialActiveSlug mude por navegacao direta
    useEffect(() => {
        setActiveSlug(initialActiveSlug);
    }, [initialActiveSlug]);

    const handleSelectCategory = (slug: string | null) => {
        // 1. Feedback visual imediato e filtragem instantanea em memoria (0ms)
        setActiveSlug(slug);

        // 2. Atualiza a URL na barra de enderecos sem recarga de pagina ou requisicoes de rede
        const targetUrl = slug ? `/c/${slug}` : "/";
        if (window.location.pathname !== targetUrl) {
            window.history.pushState(null, "", targetUrl);
        }
    };

    // Filtragem em memoria com custo de processamento praticamente nulo
    const filteredVideos = useMemo(() => {
        if (!activeSlug) return allVideos;
        return allVideos.filter((v) => v.category?.slug === activeSlug);
    }, [allVideos, activeSlug]);

    return (
        <>
            <CategoryPills
                categories={categories}
                activeSlug={activeSlug}
                onSelectCategory={handleSelectCategory}
            />
            <main className="flex-1">
                <Feed videos={filteredVideos} />
            </main>
        </>
    );
}
