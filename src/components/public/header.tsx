import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SocialIcon } from "@/components/public/social-icon";
import { getSocialPlatform } from "@/lib/social/strategies";
import type { SiteSettings, BrandSocialLink } from "@/types/database";

interface PublicHeaderProps {
    settings: SiteSettings;
    socialLinks?: BrandSocialLink[];
}

export function PublicHeader({ settings, socialLinks }: PublicHeaderProps) {
    const hasFullLogoLight = Boolean(settings.logo_url_light);
    const hasMobileIconLight = Boolean(
        settings.logo_icon_url_light || settings.logo_url_light,
    );

    const firstLetter = (settings.site_name || "P").charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/80">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
                {/* Logotipo e Identidade da Vitrine */}
                <Link
                    href="/"
                    className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                    title={settings.site_name}
                >
                    {/* Logotipo Desktop (Full) */}
                    <div className="hidden sm:flex items-center gap-2.5">
                        {hasFullLogoLight ? (
                            <>
                                <img
                                    src={settings.logo_url_light!}
                                    alt={settings.site_name}
                                    className="h-8 w-auto object-contain dark:hidden"
                                />
                                <img
                                    src={
                                        settings.logo_url_dark ||
                                        settings.logo_url_light!
                                    }
                                    alt={settings.site_name}
                                    className="hidden h-8 w-auto object-contain dark:block"
                                />
                            </>
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary text-sm font-black text-white shadow-xs">
                                {firstLetter}
                            </div>
                        )}
                        <span className="text-base font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                            {settings.site_name}
                        </span>
                    </div>

                    {/* Logotipo Mobile (Compacto) */}
                    <div className="flex sm:hidden items-center gap-2">
                        {hasMobileIconLight ? (
                            <>
                                <img
                                    src={
                                        settings.logo_icon_url_light ||
                                        settings.logo_url_light!
                                    }
                                    alt={settings.site_name}
                                    className="h-7 w-auto object-contain dark:hidden"
                                />
                                <img
                                    src={
                                        settings.logo_icon_url_dark ||
                                        settings.logo_url_dark ||
                                        settings.logo_icon_url_light ||
                                        settings.logo_url_light!
                                    }
                                    alt={settings.site_name}
                                    className="hidden h-7 w-auto object-contain dark:block"
                                />
                            </>
                        ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-xs font-black text-white shadow-xs">
                                {firstLetter}
                            </div>
                        )}
                        <span className="text-sm font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                            {settings.site_name}
                        </span>
                    </div>
                </Link>

                {/* Acoes: Botao Bio Links, Redes sociais opcionais e alternador de tema */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                    {/* Botão Direto para a Página de Bio Links */}
                    <Link
                        href="/links"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200/90 bg-zinc-100/90 text-xs font-bold text-zinc-800 hover:border-brand-primary/50 hover:bg-white hover:text-brand-primary dark:border-zinc-800/90 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-brand-primary/50 dark:hover:bg-zinc-800 dark:hover:text-brand-primary shadow-xs transition-all"
                        title="Ver canais oficiais e links da bio"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                        <span>Bio Links</span>
                    </Link>
                    {/* Canais Oficiais da Marca na Vitrine */}
                    {socialLinks && socialLinks.length > 0 ? (
                        socialLinks
                            .filter((link) => link.is_active && link.show_in_storefront)
                            .map((link) => {
                                const strategy = getSocialPlatform(link.platform);
                                return (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:flex"
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
                                    className="hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:flex"
                                    title="Instagram"
                                    aria-label="Instagram"
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
                                    className="hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:flex"
                                    title="TikTok"
                                    aria-label="TikTok"
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
                                    className="hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:flex"
                                    title="YouTube"
                                    aria-label="YouTube"
                                >
                                    <SocialIcon platform="youtube" className="h-4 w-4" />
                                </a>
                            )}
                        </>
                    )}

                    {/* Alternador de Tema Claro / Escuro */}
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
