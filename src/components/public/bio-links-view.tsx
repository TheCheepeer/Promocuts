"use client";

import React from "react";
import Link from "next/link";
import {
    Radio,
    Sparkles,
    ExternalLink,
    Play,
    ArrowLeft,
} from "lucide-react";
import { BioLinkIcon } from "@/app/admin/bio-links/bio-link-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { trackBioLinkClick } from "@/lib/telemetry";
import type { BioLink, SiteSettings } from "@/types/database";

interface BioLinksViewProps {
    settings: SiteSettings;
    bioLinks: BioLink[];
}

export function BioLinksView({ settings, bioLinks }: BioLinksViewProps) {
    const hasLiveOrHighlight = bioLinks.some(
        (l) => l.is_active && l.is_highlighted,
    );

    const liveBadge = bioLinks.find(
        (l) => l.is_active && l.is_highlighted && l.badge_text,
    );

    const firstLetter = (settings.site_name || "P").charAt(0).toUpperCase();

    const handleLinkClick = (linkId: string) => {
        trackBioLinkClick(linkId);
    };

    return (
        <div className="flex min-h-dvh flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
            {/* Barra Superior de Navegação */}
            <header className="sticky top-0 z-20 w-full border-b border-zinc-200/60 bg-white/80 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80">
                <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-100/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200/80 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Vitrine de Cortes</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Conteúdo Central do Hub de Bio Links */}
            <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:py-12 space-y-6">
                {/* Bloco de Perfil do Criador */}
                <div className="flex flex-col items-center text-center space-y-3">
                    {/* Avatar com Anel Estilizado e Indicador Pulsante */}
                    <div className="relative">
                        {settings.logo_icon_url_light ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={settings.logo_icon_url_light}
                                    alt={settings.site_name}
                                    className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-primary/30 shadow-md dark:hidden"
                                />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        settings.logo_icon_url_dark ||
                                        settings.logo_icon_url_light
                                    }
                                    alt={settings.site_name}
                                    className="hidden h-24 w-24 rounded-full object-cover ring-4 ring-brand-primary/30 shadow-md dark:block"
                                />
                            </>
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 text-2xl font-black text-white shadow-md ring-4 ring-brand-primary/20">
                                {firstLetter}
                            </div>
                        )}

                        {hasLiveOrHighlight && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
                            </span>
                        )}
                    </div>

                    {/* Nome e Badge de Destaque */}
                    <div className="space-y-1">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                            {settings.site_name}
                        </h1>

                        {liveBadge?.badge_text && (
                            <div className="flex justify-center pt-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs animate-pulse">
                                    <Radio className="h-3 w-3" />
                                    {liveBadge.badge_text}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tagline e Descrição */}
                    <p className="max-w-md text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        {settings.site_tagline ||
                            "Cortes virais, reviews de produtos e links oficiais"}
                    </p>

                    {settings.site_description && (
                        <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                            {settings.site_description}
                        </p>
                    )}

                    {/* Redes Sociais Oficiais */}
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                        {settings.social_instagram && (
                            <a
                                href={
                                    settings.social_instagram.startsWith("http")
                                        ? settings.social_instagram
                                        : `https://instagram.com/${settings.social_instagram.replace("@", "")}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-xs"
                                title="Instagram"
                                aria-label="Instagram Oficial"
                            >
                                <svg
                                    className="h-4 w-4 fill-none stroke-current stroke-2"
                                    viewBox="0 0 24 24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        width="20"
                                        height="20"
                                        x="2"
                                        y="2"
                                        rx="5"
                                        ry="5"
                                    />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                </svg>
                            </a>
                        )}

                        {settings.social_tiktok && (
                            <a
                                href={
                                    settings.social_tiktok.startsWith("http")
                                        ? settings.social_tiktok
                                        : `https://tiktok.com/@${settings.social_tiktok.replace("@", "")}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-xs"
                                title="TikTok"
                                aria-label="TikTok Oficial"
                            >
                                <svg
                                    className="h-4 w-4 fill-current"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.41a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.27 8.27 0 0 0 4.77 1.47V7.07a4.82 4.82 0 0 1-1-.38z" />
                                </svg>
                            </a>
                        )}

                        {settings.social_youtube && (
                            <a
                                href={
                                    settings.social_youtube.startsWith("http")
                                        ? settings.social_youtube
                                        : `https://youtube.com/${settings.social_youtube.replace("@", "")}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-xs"
                                title="YouTube"
                                aria-label="Canal no YouTube"
                            >
                                <svg
                                    className="h-4 w-4 fill-current"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                        )}
                    </div>
                </div>

                {/* Card de Destaque da Vitrine (Ponte de Conversão com o Feed de Vídeos) */}
                <div className="overflow-hidden rounded-2xl border-2 border-brand-primary/40 bg-gradient-to-br from-brand-primary/10 via-white to-indigo-50/20 p-5 shadow-sm transition-all hover:border-brand-primary/60 dark:from-brand-primary/15 dark:via-zinc-900 dark:to-indigo-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase tracking-wider">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Vitrine de Cortes & Ofertas</span>
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
                                Vídeos Curtos com Produtos Recomendados
                            </h2>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Assista aos cortes em tela cheia e acesse cupons de desconto exclusivos.
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-primary/90 shrink-0"
                        >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Abrir Vitrine</span>
                        </Link>
                    </div>
                </div>

                {/* Lista Vertical de Bio Links */}
                <div className="space-y-3 pt-2">
                    {bioLinks.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                Nenhum link configurado no momento.
                            </p>
                            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                                Novos canais e comunidades serão publicados em breve.
                            </p>
                        </div>
                    ) : (
                        bioLinks.map((link) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleLinkClick(link.id)}
                                className="group relative flex items-center justify-between gap-3.5 rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-primary/60 hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-900/90 dark:hover:border-brand-primary/60"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 transition-colors group-hover:bg-brand-primary/10 group-hover:text-brand-primary dark:bg-zinc-800 dark:text-zinc-200">
                                        <BioLinkIcon
                                            name={link.icon}
                                            className="h-5 w-5"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-primary transition-colors">
                                            {link.title}
                                        </p>
                                        <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                                            {link.url.replace(/^https?:\/\//i, "")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {link.badge_text && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                                                link.is_highlighted
                                                    ? "bg-red-600 text-white animate-pulse"
                                                    : "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20"
                                            }`}
                                        >
                                            {link.badge_text}
                                        </span>
                                    )}

                                    <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary transition-colors" />
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </main>

            {/* Rodapé Limpo */}
            <footer className="w-full border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400">
                <div className="mx-auto flex max-w-xl items-center justify-between px-4">
                    <span>
                        {settings.footer_text ||
                            `${settings.site_name} — Todos os direitos reservados.`}
                    </span>
                    <a
                        href="https://github.com/TheCheepeer/Promocuts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
}
