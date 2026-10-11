"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Share2, Check, ExternalLink, X } from "lucide-react";
import { VideoPlayer } from "./video-player";
import { ProductCard } from "./product-card";
import type { VideoWithRelations } from "./feed-mobile";
import type { Product } from "@/types/database";

interface FeedDesktopProps {
    videos: VideoWithRelations[];
}

export function FeedDesktop({ videos }: FeedDesktopProps) {
    const [selectedVideo, setSelectedVideo] =
        useState<VideoWithRelations | null>(null);
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

    useEffect(() => {
        setSelectedVideo(null);
    }, [videos]);

    const handleShare = (e: React.MouseEvent, video: VideoWithRelations) => {
        e.preventDefault();
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/v/${video.slug}`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedSlug(video.slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    if (!videos || videos.length === 0) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center text-zinc-500 dark:text-zinc-400">
                <p className="text-base font-medium">
                    Nenhum corte disponivel no momento nesta categoria.
                </p>
                <Link
                    href="/"
                    className="mt-3 text-sm font-semibold text-brand-primary hover:underline"
                >
                    Explorar todos os cortes
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => {
                    const products = (video.video_products || [])
                        .map((vp) => vp.product)
                        .filter((p): p is Product => Boolean(p));
                    const primaryProduct = products[0];

                    return (
                        <div
                            key={video.id}
                            className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                        >
                            {/* Area de Preview do Video (9:16) */}
                            <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
                                <img
                                    src={
                                        video.thumbnail_url ||
                                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='640' fill='%23111'></svg>"
                                    }
                                    alt={video.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                {/* Pelicula de degradê para contraste de texto */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                                {/* Badges Superiores */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                                    {video.category ? (
                                        <Link
                                            href={`/c/${video.category.slug}`}
                                            className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md transition-colors hover:bg-black/90"
                                        >
                                            {video.category.name}
                                        </Link>
                                    ) : (
                                        <span />
                                    )}

                                    <button
                                        type="button"
                                        onClick={(e) => handleShare(e, video)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/90"
                                        title="Copiar link"
                                    >
                                        {copiedSlug === video.slug ? (
                                            <Check className="h-3.5 w-3.5 text-brand-primary" />
                                        ) : (
                                            <Share2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>

                                {/* Botao Central de Play */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedVideo(video)}
                                        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-md transition-all duration-200 group-hover:scale-110 group-hover:bg-brand-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary"
                                        aria-label={`Assistir ${video.title}`}
                                    >
                                        <Play className="ml-1 h-6 w-6 fill-current" />
                                    </button>
                                </div>

                                {/* Titulo e Descricao sobrepostos na base do preview */}
                                <div className="absolute bottom-3 left-3 right-3 z-10">
                                    <h3 className="line-clamp-2 text-xs font-bold text-white drop-shadow-sm leading-snug">
                                        {video.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Informacoes de Produtos Recomendados */}
                            <div className="flex flex-1 flex-col justify-between p-4">
                                {primaryProduct ? (
                                    <ProductCard
                                        product={primaryProduct}
                                        videoId={video.id}
                                        compact
                                        className="border-0 bg-zinc-50 p-2 shadow-none dark:bg-zinc-800/60"
                                    />
                                ) : (
                                    <div className="rounded-xl bg-zinc-50 p-2 text-center text-xs text-zinc-400 dark:bg-zinc-800/40 dark:text-zinc-500">
                                        Nenhum produto vinculado
                                    </div>
                                )}

                                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                                    <Link
                                        href={`/v/${video.slug}`}
                                        className="text-xs font-semibold text-zinc-600 transition-colors hover:text-brand-primary dark:text-zinc-400 dark:hover:text-brand-primary"
                                    >
                                        Ver pagina do corte
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedVideo(video)}
                                        className="text-xs font-bold text-brand-primary hover:underline"
                                    >
                                        Assistir
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Reproducao Desktop Imersivo */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                        {/* Botao de Fechar */}
                        <button
                            type="button"
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-400 backdrop-blur-md transition-colors hover:bg-zinc-800 hover:text-white"
                            aria-label="Fechar reprodutor"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex w-full flex-col md:flex-row">
                            {/* Area do Video */}
                            <div className="flex flex-1 items-center justify-center bg-black p-4">
                                <VideoPlayer
                                    platform={selectedVideo.platform}
                                    platformVideoId={
                                        selectedVideo.platform_video_id
                                    }
                                    title={selectedVideo.title}
                                    thumbnailUrl={selectedVideo.thumbnail_url}
                                    isActive
                                    priority
                                    className="max-h-[75vh]"
                                />
                            </div>

                            {/* Coluna Lateral de Produtos e Informacoes */}
                            <div className="flex w-full flex-col justify-between border-t border-zinc-800 bg-zinc-900/90 p-6 md:w-80 md:border-t-0 md:border-l md:overflow-y-auto">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {selectedVideo.category && (
                                            <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-primary">
                                                {selectedVideo.category.name}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                                            {selectedVideo.platform}
                                        </span>
                                    </div>

                                    <h2 className="mt-2 text-base font-extrabold text-white leading-tight">
                                        {selectedVideo.title}
                                    </h2>

                                    {selectedVideo.description && (
                                        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                                            {selectedVideo.description}
                                        </p>
                                    )}

                                    {/* Lista de Produtos */}
                                    <div className="mt-6">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                                            Produtos Recomendados
                                        </h3>

                                        <div className="space-y-3">
                                            {(
                                                selectedVideo.video_products ||
                                                []
                                            ).map((vp) => {
                                                if (!vp.product) return null;
                                                return (
                                                    <ProductCard
                                                        key={vp.product.id}
                                                        product={vp.product}
                                                        videoId={
                                                            selectedVideo.id
                                                        }
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-zinc-800 pt-4 flex items-center justify-between text-xs text-zinc-400">
                                    <a
                                        href={selectedVideo.original_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-white transition-colors"
                                    >
                                        <span>Abrir na rede de origem</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
