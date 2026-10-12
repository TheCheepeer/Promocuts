"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Radio,
} from "lucide-react";
import { BioLinkIcon, BIO_LINK_AVAILABLE_ICONS } from "@/app/admin/bio-links/bio-link-icons";
import { trackBioLinkClick } from "@/lib/telemetry";
import type { BioLink, SiteSettings } from "@/types/database";

interface CreatorProfileProps {
    settings: SiteSettings;
    bioLinks: BioLink[];
}

export function CreatorProfile({ settings, bioLinks }: CreatorProfileProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!bioLinks || bioLinks.length === 0) {
        return null;
    }

    const hasLiveOrHighlight = bioLinks.some(
        (l) => l.is_active && l.is_highlighted,
    );

    const highlightedLink = bioLinks.find(
        (l) => l.is_active && l.is_highlighted && l.badge_text,
    );

    const firstLetter = (settings.site_name || "P").charAt(0).toUpperCase();

    const handleLinkClick = (linkId: string) => {
        trackBioLinkClick(linkId);
    };

    return (
        <section
            aria-label="Perfil do Criador e Links de Comunidades"
            className="w-full border-b border-zinc-200/80 bg-white/70 backdrop-blur-md transition-all dark:border-zinc-800/80 dark:bg-zinc-950/70"
        >
            <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
                {/* Barra Retrátil de Resumo */}
                <div className="flex items-center justify-between gap-3">
                    {/* Identidade do Criador */}
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {settings.logo_icon_url_light ? (
                                <>
                                    <img
                                        src={settings.logo_icon_url_light}
                                        alt={settings.site_name}
                                        className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-primary/30 dark:hidden"
                                    />
                                    <img
                                        src={
                                            settings.logo_icon_url_dark ||
                                            settings.logo_icon_url_light
                                        }
                                        alt={settings.site_name}
                                        className="hidden h-9 w-9 rounded-full object-cover ring-2 ring-brand-primary/30 dark:block"
                                    />
                                </>
                            ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 text-xs font-black text-white shadow-xs ring-2 ring-brand-primary/20">
                                    {firstLetter}
                                </div>
                            )}

                            {hasLiveOrHighlight && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                                </span>
                            )}
                        </div>

                        {/* Nome e Tagline */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="truncate text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                    {settings.site_name}
                                </span>

                                {highlightedLink?.badge_text && (
                                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                                        <Radio className="h-2.5 w-2.5" />
                                        {highlightedLink.badge_text}
                                    </span>
                                )}
                            </div>

                            <p className="truncate text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                                {settings.site_tagline ||
                                    "Cortes virais, reviews de produtos e links oficiais"}
                            </p>
                        </div>
                    </div>

                    {/* Botão de Expansão / Recolhimento */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs shrink-0 ${
                            isOpen
                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                : hasLiveOrHighlight
                                ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
                                : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        }`}
                    >
                        {hasLiveOrHighlight && (
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                        <span>{isOpen ? "Recolher" : "Links & Bio"}</span>
                        <span className="hidden xs:inline-block text-[11px] opacity-75">
                            ({bioLinks.length})
                        </span>
                        {isOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                        )}
                    </button>
                </div>

                {/* Gaveta Expansível de Bio Links */}
                {isOpen && (
                    <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-4 animate-in fade-in-50 duration-200">
                        {settings.site_description && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                                {settings.site_description}
                            </p>
                        )}

                        {/* Grade de Links de Bio */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {bioLinks.map((link) => {
                                const iconOption =
                                    BIO_LINK_AVAILABLE_ICONS.find((i) => i.id === link.icon) ||
                                    BIO_LINK_AVAILABLE_ICONS[BIO_LINK_AVAILABLE_ICONS.length - 1];

                                return (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleLinkClick(link.id)}
                                        className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                                            link.is_highlighted
                                                ? "border-red-300 bg-red-50/50 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/20 dark:hover:bg-red-950/40"
                                                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs transition-transform group-hover:scale-105"
                                                style={{ backgroundColor: iconOption.brandColor }}
                                            >
                                                <BioLinkIcon name={link.icon} className="h-4 w-4" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-primary transition-colors">
                                                        {link.title}
                                                    </span>

                                                    {link.badge_text && (
                                                        <span
                                                            className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold tracking-wider uppercase text-white shadow-xs ${
                                                                link.is_highlighted
                                                                    ? "bg-red-600 animate-pulse"
                                                                    : "bg-brand-primary"
                                                            }`}
                                                        >
                                                            {link.badge_text}
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="block truncate text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                                                    {link.url.replace(/^https?:\/\/(www\.)?/, "")}
                                                </span>
                                            </div>
                                        </div>

                                        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
                                    </a>
                                );
                            })}
                        </div>

                        <div className="flex justify-end pt-1">
                            <Link
                                href="/links"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline transition-all"
                            >
                                <span>Abrir página dedicada de Bio Links</span>
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
