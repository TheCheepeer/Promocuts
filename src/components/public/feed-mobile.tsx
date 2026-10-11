"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Share2, Check, ExternalLink } from "lucide-react";
import { VideoPlayer } from "./video-player";
import { ProductDrawer } from "./product-drawer";
import type { Video, Product } from "@/types/database";

export interface VideoWithRelations extends Video {
    category?: {
        id?: string;
        name: string;
        slug: string;
        icon?: string | null;
    } | null;
    video_products?: {
        id?: string;
        product_id: string;
        display_order: number;
        product?: Product;
    }[];
}

interface FeedMobileProps {
    videos: VideoWithRelations[];
}

export function FeedMobile({ videos }: FeedMobileProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        setActiveIndex(0);
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
    }, [videos]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(
                            entry.target.getAttribute("data-index"),
                        );
                        if (!isNaN(index)) {
                            setActiveIndex(index);
                        }
                    }
                });
            },
            {
                threshold: 0.6,
            },
        );

        itemRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [videos]);

    const handleShare = async (video: VideoWithRelations) => {
        const shareUrl = `${window.location.origin}/v/${video.slug}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text:
                        video.description ||
                        `Confira este corte no PromoCuts: ${video.title}`,
                    url: shareUrl,
                });
                return;
            } catch {
                // Se o usuario cancelar o compartilhamento nativo, nao faz nada
            }
        }

        // Fallback: copia para a area de transferencia
        navigator.clipboard.writeText(shareUrl);
        setCopiedSlug(video.slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    if (!videos || videos.length === 0) {
        return (
            <div className="flex h-96 flex-col items-center justify-center p-6 text-center text-zinc-500 dark:text-zinc-400">
                <p className="text-sm font-medium">
                    Nenhum corte disponivel no momento nesta categoria.
                </p>
                <Link
                    href="/"
                    className="mt-3 text-xs font-semibold text-brand-primary underline"
                >
                    Ver todos os cortes
                </Link>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-[calc(100dvh-57px)] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
            {videos.map((video, idx) => {
                const isActive = activeIndex === idx;
                const products = (video.video_products || [])
                    .map((vp) => vp.product)
                    .filter((p): p is Product => Boolean(p));

                return (
                    <div
                        key={video.id}
                        ref={(el) => {
                            itemRefs.current[idx] = el;
                        }}
                        data-index={idx}
                        className="relative flex h-[calc(100dvh-57px)] w-full snap-start snap-always items-center justify-center bg-black overflow-hidden"
                    >
                        {/* Player de Video com Proporcao 9:16 */}
                        <div className="relative flex h-full w-full max-w-[420px] items-center justify-center">
                            <VideoPlayer
                                platform={video.platform}
                                platformVideoId={video.platform_video_id}
                                title={video.title}
                                thumbnailUrl={video.thumbnail_url}
                                isActive={isActive}
                                priority={idx === 0}
                                className="h-full max-h-full w-full rounded-none sm:rounded-2xl"
                            />

                            {/* Informacoes Superiores: Categoria e Titulo */}
                            <div className="pointer-events-none absolute top-3 left-3 right-12 z-20">
                                {video.category && (
                                    <Link
                                        href={`/c/${video.category.slug}`}
                                        className="pointer-events-auto inline-block rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white/95 backdrop-blur-md transition-colors hover:bg-black/80"
                                    >
                                        {video.category.name}
                                    </Link>
                                )}
                                <h3 className="mt-1 line-clamp-1 text-xs font-bold text-white drop-shadow-md">
                                    {video.title}
                                </h3>
                            </div>

                            {/* Botoes Flutuantes Laterais */}
                            <div className="absolute right-2.5 top-12 z-30 flex flex-col items-center gap-3">
                                {/* Botao Compartilhar */}
                                <button
                                    type="button"
                                    onClick={() => handleShare(video)}
                                    className="flex h-10 w-10 flex-col items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
                                    title="Compartilhar corte"
                                    aria-label="Compartilhar corte"
                                >
                                    {copiedSlug === video.slug ? (
                                        <Check className="h-4 w-4 text-brand-primary" />
                                    ) : (
                                        <Share2 className="h-4 w-4" />
                                    )}
                                    <span className="text-[9px] font-semibold mt-0.5">
                                        {copiedSlug === video.slug
                                            ? "Copiado"
                                            : "Link"}
                                    </span>
                                </button>

                                {/* Link Original Externo */}
                                <a
                                    href={video.original_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-10 w-10 flex-col items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
                                    title="Abrir no aplicativo de origem"
                                    aria-label="Abrir no aplicativo de origem"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="text-[9px] font-semibold mt-0.5">
                                        Rede
                                    </span>
                                </a>
                            </div>

                            {/* Painel Inferior de Produtos (Bottom Drawer) */}
                            {products.length > 0 && (
                                <div className="absolute bottom-3 left-3 right-3 z-30">
                                    <ProductDrawer
                                        products={products}
                                        videoId={video.id}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
