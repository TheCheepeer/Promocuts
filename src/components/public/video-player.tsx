"use client";

import React, { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { getEmbedIframeConfig } from "@/lib/embeds/parser";
import type { VideoPlatform } from "@/types/database";

interface VideoPlayerProps {
    platform: VideoPlatform;
    platformVideoId: string;
    title: string;
    thumbnailUrl?: string | null;
    priority?: boolean;
    isActive?: boolean;
    className?: string;
}

const PLATFORM_LABELS: Record<VideoPlatform, string> = {
    tiktok: "TikTok",
    reels: "Instagram Reels",
    shorts: "YouTube Shorts",
};

export function VideoPlayer({
    platform,
    platformVideoId,
    title,
    thumbnailUrl,
    priority = false,
    isActive = true,
    className = "",
}: VideoPlayerProps) {
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);
    const [shouldMountIframe, setShouldMountIframe] = useState(
        priority || isActive,
    );

    // Se o slide se tornar ativo ou tiver prioridade, autoriza a montagem do iframe
    useEffect(() => {
        if (isActive || priority) {
            setShouldMountIframe(true);
        }
    }, [isActive, priority]);

    const iframeConfig = getEmbedIframeConfig(platform, platformVideoId, title);

    const handlePlayClick = () => {
        setShouldMountIframe(true);
    };

    return (
        <div
            className={`relative aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-2xl bg-black shadow-md ${className}`}
        >
            {/* Camada do Iframe Oficial */}
            {shouldMountIframe && (
                <iframe
                    src={iframeConfig.src}
                    title={iframeConfig.title}
                    allow={iframeConfig.allow}
                    sandbox={iframeConfig.sandbox}
                    referrerPolicy={iframeConfig.referrerPolicy}
                    loading={priority ? "eager" : "lazy"}
                    onLoad={() => setIsIframeLoaded(true)}
                    className="absolute inset-0 h-full w-full border-0"
                />
            )}

            {/* Poster / Miniatura Antecipada e Estado de Carregamento */}
            {(!shouldMountIframe || !isIframeLoaded) && (
                <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 text-white transition-opacity duration-300"
                    style={{
                        backgroundImage: thumbnailUrl
                            ? `url(${thumbnailUrl})`
                            : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    {/* Pelicula escura para contraste */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

                    {/* Conteudo do Poster */}
                    <div className="relative z-20 flex flex-col items-center p-4 text-center">
                        {shouldMountIframe ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-white/90" />
                                <span className="text-xs font-medium text-white/80">
                                    Carregando video...
                                </span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handlePlayClick}
                                className="group flex h-14 w-14 items-center justify-center rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/30 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary"
                                aria-label={`Assistir ${title}`}
                            >
                                <Play className="ml-1 h-6 w-6 fill-current transition-transform group-hover:scale-105" />
                            </button>
                        )}

                        <div className="mt-4 max-w-[85%]">
                            <span className="inline-block rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                                {PLATFORM_LABELS[platform]}
                            </span>
                            <p className="mt-2 line-clamp-2 text-xs font-medium text-white/90 drop-shadow-sm">
                                {title}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
