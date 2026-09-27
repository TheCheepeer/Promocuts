"use client";

import React, { useState } from "react";
import { parseVideoUrl, type ParsedVideoEmbed } from "@/lib/embeds/parser";
import { formatCurrency } from "@/lib/formatters";
import { Check, Copy, ExternalLink, Play, Sparkles, Video } from "lucide-react";

const SAMPLES = [
    {
        name: "YouTube Shorts",
        url: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    },
    {
        name: "Instagram Reels",
        url: "https://www.instagram.com/reel/C7xyz123/",
    },
    {
        name: "TikTok",
        url: "https://www.tiktok.com/@criador/video/7123456789012345678",
    },
];

export function EmbedTester() {
    const [url, setUrl] = useState(SAMPLES[0].url);
    const [copied, setCopied] = useState(false);

    const parsed: ParsedVideoEmbed | null = parseVideoUrl(url);

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xl shadow-zinc-900/5 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                            Pre-visualizacao de Videos
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Cole qualquer link do TikTok, Instagram Reels ou
                            YouTube Shorts para visualizar a incorporacao
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {SAMPLES.map((sample) => (
                        <button
                            key={sample.name}
                            type="button"
                            onClick={() => setUrl(sample.url)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                                url === sample.url
                                    ? "bg-brand-primary text-white shadow-sm"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                        >
                            {sample.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <div>
                    <label
                        htmlFor="video-url-input"
                        className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2"
                    >
                        URL do Video Original
                    </label>
                    <div className="relative flex items-center">
                        <input
                            id="video-url-input"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Ex: https://www.youtube.com/shorts/..."
                            className="w-full h-12 pl-4 pr-12 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-950/50 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                        />
                        <div className="absolute right-3 text-zinc-400">
                            <Video className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {parsed ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                                    <Play className="w-3 h-3 fill-current" />
                                    {parsed.platform.toUpperCase()}
                                </span>
                                <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                                    ID:{" "}
                                    <strong className="text-zinc-900 dark:text-white">
                                        {parsed.platformVideoId}
                                    </strong>
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleCopy(parsed.embedUrl)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Copiado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copiar Embed URL</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div>
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                Link Padronizado de Incorporacao
                            </span>
                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all select-all">
                                {parsed.embedUrl}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60">
                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
                                    Exemplo de Conversao Afiliada
                                </span>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-600 dark:text-zinc-300">
                                        Preco Promocional:
                                    </span>
                                    <strong className="text-brand-primary font-mono text-sm">
                                        {formatCurrency(89.9)}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between text-xs mt-1">
                                    <span className="text-zinc-400 line-through">
                                        {formatCurrency(149.9)}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        -40%
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                                        Visualizacao de Afiliado
                                    </span>
                                    <span className="text-xs text-zinc-700 dark:text-zinc-300">
                                        Exibicao direta da plataforma original
                                    </span>
                                </div>
                                <a
                                    href={parsed.embedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    title="Abrir embed em nova aba"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400">
                        URL invalida ou nao reconhecida. Forneca um link valido
                        do TikTok, Instagram Reels ou YouTube Shorts.
                    </div>
                )}
            </div>
        </div>
    );
}
