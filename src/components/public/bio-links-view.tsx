"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Radio,
    Sparkles,
    ExternalLink,
    Play,
    ArrowLeft,
    Share2,
    Check,
    QrCode as QrCodeIcon,
    Smartphone,
} from "lucide-react";
import { BioLinkIcon } from "@/app/admin/bio-links/bio-link-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { trackBioLinkClick } from "@/lib/telemetry";
import { generateQrCodeSvg } from "@/lib/qrcode";
import { SocialIcon } from "@/components/public/social-icon";
import { getSocialPlatform } from "@/lib/social/strategies";
import type { BioLink, SiteSettings, BrandSocialLink } from "@/types/database";

interface BioLinksViewProps {
    settings: SiteSettings;
    bioLinks: BioLink[];
    socialLinks?: BrandSocialLink[];
}

export function BioLinksView({
    settings,
    bioLinks,
    socialLinks,
}: BioLinksViewProps) {
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const canonicalBaseUrl = (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        ""
    ).replace(/\/+$/, "");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const isLocal =
                !canonicalBaseUrl ||
                canonicalBaseUrl.includes("localhost") ||
                canonicalBaseUrl.includes("127.0.0.1");

            const detectedUrl =
                !isLocal && canonicalBaseUrl
                    ? `${canonicalBaseUrl}/links`
                    : `${window.location.origin}/links`;

            setShareUrl(detectedUrl);
        }
    }, [canonicalBaseUrl]);
    const firstLetter = (settings.site_name || "P").charAt(0).toUpperCase();

    // Cascata de Fallback Inteligente para Foto de Perfil
    const avatarLight =
        settings.bio_avatar_url_light ||
        settings.logo_icon_url_light ||
        settings.logo_url_light ||
        settings.favicon_url_light ||
        null;

    const avatarDark =
        settings.bio_avatar_url_dark ||
        settings.logo_icon_url_dark ||
        settings.logo_url_dark ||
        settings.favicon_url_dark ||
        avatarLight;

    const bioTitle = settings.bio_title || settings.site_name;
    const bioDescription =
        settings.bio_description ||
        settings.site_tagline ||
        "Cortes virais, reviews de achadinhos e canais oficiais.";

    const bannerStyle = settings.bio_show_storefront_banner || "banner";
    const showQrCode = settings.bio_show_qrcode !== false;

    // Resolução de cores: herda automaticamente as cores da vitrine,
    // a menos que o criador tenha definido uma cor dedicada para a bio.
    const activePrimaryLight =
        settings.bio_primary_color_light ||
        settings.primary_color_light ||
        "#10B981";

    const activePrimaryDark =
        settings.bio_primary_color_dark ||
        settings.primary_color_dark ||
        activePrimaryLight;

    const customBioCss = `
        .bio-links-container {
            --brand-primary: ${activePrimaryLight};
        }
        .dark .bio-links-container,
        :root.dark .bio-links-container {
            --brand-primary: ${activePrimaryDark};
        }
    `;

    const handleLinkClick = (linkId: string) => {
        trackBioLinkClick(linkId);
    };

    const handleShare = async () => {
        const urlToShare = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
        if (navigator.share) {
            try {
                await navigator.share({
                    title: bioTitle,
                    text: bioDescription,
                    url: urlToShare,
                });
                return;
            } catch {
                // Cancelamento do usuário ou fallback para cópia
            }
        }

        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(urlToShare);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // Fallback silencioso
            }
        }
    };

    // QR Code em SVG Puro (Módulos pretos sobre fundo branco para leitura óptica garantida em smartphones)
    const qrSvg = showQrCode && shareUrl ? generateQrCodeSvg(shareUrl, {
        size: 160,
        margin: 2,
        darkColor: "#000000",
        lightColor: "#ffffff",
    }) : "";

    return (
        <div className="bio-links-container flex min-h-dvh flex-col justify-between bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
            {/* Injeção de estilo dinâmico para garantir que a cor primária herde da vitrine ou do bio links */}
            <style dangerouslySetInnerHTML={{ __html: customBioCss }} />

            {/* Barra Superior Flutuante */}
            <header className="sticky top-0 z-20 w-full border-b border-zinc-200/60 bg-white/80 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-100/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200/80 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Vitrine de Cortes</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleShare}
                            aria-label="Compartilhar página de links"
                            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-brand-primary" />
                                    <span className="text-brand-primary">Copiado!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span>Compartilhar</span>
                                </>
                            )}
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Área Principal: Feed Centralizado + QR Code Desktop */}
            <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-10 flex justify-center items-start gap-8">
                {/* Cartão Central Vertical (Inspirado no Linktree) */}
                <main className="w-full max-w-md bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    {/* Bloco de Perfil do Criador */}
                    <div className="flex flex-col items-center text-center space-y-3.5">
                        {/* Avatar com Anel Estilizado e Fallback Inteligente */}
                        <div className="relative">
                            {avatarLight ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={avatarLight}
                                        alt={settings.site_name}
                                        className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-primary/30 shadow-md dark:hidden"
                                    />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={avatarDark || avatarLight}
                                        alt={settings.site_name}
                                        className="hidden h-24 w-24 rounded-full object-cover ring-4 ring-brand-primary/30 shadow-md dark:block"
                                    />
                                </>
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 text-2xl font-black text-white shadow-md ring-4 ring-brand-primary/20">
                                    {firstLetter}
                                </div>
                            )}
                        </div>

                        {/* Nome do Criador */}
                        <div className="space-y-1">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                                {bioTitle}
                            </h1>
                        </div>

                        {/* Biografia / Tagline */}
                        <p className="max-w-sm text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                            {bioDescription}
                        </p>

                        {/* Redes Sociais Oficiais */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                            {socialLinks && socialLinks.length > 0 ? (
                                socialLinks
                                    .filter((link) => link.is_active && link.show_in_bio)
                                    .map((link) => {
                                        const strategy = getSocialPlatform(link.platform);
                                        return (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-xs"
                                                title={strategy.name}
                                                aria-label={strategy.name}
                                            >
                                                <SocialIcon platform={link.platform} className="h-4 w-4" />
                                            </a>
                                        );
                                    })
                            ) : (
                                <>
                                    {settings.social_instagram && (
                                        <a
                                            href={
                                                settings.social_instagram.startsWith("http")
                                                    ? settings.social_instagram
                                                    : `https://instagram.com/${settings.social_instagram.replace("@", "")}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-xs"
                                            title="Instagram"
                                            aria-label="Instagram Oficial"
                                        >
                                            <SocialIcon platform="instagram" className="h-4 w-4" />
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
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-xs"
                                            title="TikTok"
                                            aria-label="TikTok Oficial"
                                        >
                                            <SocialIcon platform="tiktok" className="h-4 w-4" />
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
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-xs"
                                            title="YouTube"
                                            aria-label="Canal no YouTube"
                                        >
                                            <SocialIcon platform="youtube" className="h-4 w-4" />
                                        </a>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Cartaz da Vitrine de Cortes (Conforme Configuração) */}
                    {bannerStyle === "banner" && (
                        <div className="overflow-hidden rounded-2xl border-2 border-brand-primary/40 bg-gradient-to-br from-brand-primary/10 via-white to-brand-primary/5 p-5 shadow-xs transition-all hover:border-brand-primary/60 dark:from-brand-primary/15 dark:via-zinc-950 dark:to-brand-primary/5">
                            <div className="flex flex-col gap-3">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase tracking-wider">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>Vitrine de Cortes</span>
                                    </div>
                                    <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                                        Vídeos Curtos & Achadinhos
                                    </h2>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Assista aos melhores cortes verticais e aproveite cupons exclusivos.
                                    </p>
                                </div>

                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-98"
                                >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    <span>Abrir Vitrine de Vídeos</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {bannerStyle === "compact" && (
                        <Link
                            href="/"
                            className="group flex items-center justify-between gap-3.5 rounded-2xl border border-brand-primary/40 bg-brand-primary/10 dark:bg-brand-primary/20 p-3.5 sm:p-4 shadow-xs transition-all hover:border-brand-primary hover:shadow-md"
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-xs">
                                    <Play className="h-5 w-5 fill-current" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-primary transition-colors">
                                        Vitrine de Vídeos & Ofertas
                                    </p>
                                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Assista aos cortes verticais na íntegra
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shrink-0">
                                Vitrine
                            </span>
                        </Link>
                    )}

                    {/* Lista Vertical de Bio Links */}
                    <div className="space-y-3 pt-1">
                        {bioLinks.length === 0 ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    Nenhum link ativo no momento.
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
                                    className={`group relative flex items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                        link.is_highlighted
                                            ? "border-red-500/70 bg-red-50/30 dark:border-red-500/50 dark:bg-red-950/20 ring-2 ring-red-500/25 animate-pulse hover:border-red-500 hover:bg-red-50/60 dark:hover:bg-red-950/30"
                                            : "border-zinc-200/90 bg-zinc-50/50 hover:border-brand-primary hover:bg-white dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:hover:border-brand-primary dark:hover:bg-zinc-950"
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-2xs transition-colors ${
                                                link.is_highlighted
                                                    ? "bg-red-500 text-white"
                                                    : "bg-white text-zinc-800 group-hover:bg-brand-primary/10 group-hover:text-brand-primary dark:bg-zinc-800 dark:text-zinc-200 dark:group-hover:bg-brand-primary/20 dark:group-hover:text-brand-primary"
                                            }`}
                                        >
                                            <BioLinkIcon
                                                name={link.icon}
                                                url={link.url}
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
                                        {link.badge_text ? (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-xs ${
                                                    link.is_highlighted
                                                        ? "bg-red-600 text-white animate-pulse"
                                                        : "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20"
                                                }`}
                                            >
                                                {link.is_highlighted && (
                                                    <Radio className="h-2.5 w-2.5" />
                                                )}
                                                {link.badge_text}
                                            </span>
                                        ) : link.is_highlighted ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs animate-pulse">
                                                <Radio className="h-2.5 w-2.5" />
                                                Destaque
                                            </span>
                                        ) : null}

                                        <ExternalLink
                                            className={`h-4 w-4 transition-colors ${
                                                link.is_highlighted
                                                    ? "text-red-500 group-hover:text-red-600"
                                                    : "text-zinc-400 group-hover:text-brand-primary"
                                            }`}
                                        />
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </main>

                {/* Widget Lateral de QR Code Desktop */}
                {showQrCode && (
                    <aside
                        aria-label="QR Code para Celular"
                        className="hidden lg:flex flex-col items-center w-64 bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm sticky top-20 text-center space-y-4"
                    >
                        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                            <Smartphone className="w-4 h-4 text-brand-primary" />
                            <h2 className="text-xs font-bold uppercase tracking-wider">
                                Abrir no Celular
                            </h2>
                        </div>

                        {/* Contêiner de Renderização do SVG (Fundo branco para leitura de câmera) */}
                        <div className="p-3 bg-white rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-center">
                            {qrSvg ? (
                                <div
                                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                                    className="w-36 h-36 flex items-center justify-center overflow-hidden"
                                />
                            ) : (
                                <div className="w-36 h-36 flex items-center justify-center text-zinc-400">
                                    <QrCodeIcon className="w-8 h-8 animate-pulse" />
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Aponte a câmera do seu celular para carregar instantaneamente esta página de links.
                        </p>
                    </aside>
                )}
            </div>

            {/* Rodapé Limpo */}
            <footer className="w-full border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6">
                    <span>
                        {settings.footer_text ||
                            `${settings.site_name} — Todos os direitos reservados.`}
                    </span>
                    <a
                        href="https://github.com/TheCheepeer/Promocuts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                    >
                        GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
}
