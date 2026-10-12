"use client";

import React, { useState, useTransition } from "react";
import {
    Save,
    Loader2,
    CheckCircle2,
    Palette,
    Sparkles,
    Globe,
} from "lucide-react";
import { AssetInput } from "./asset-input";
import { updateSiteSettingsAction } from "./actions";
import type { SiteSettings } from "@/types/database";

interface SettingsFormProps {
    settings: SiteSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // Identidade
    const [siteName, setSiteName] = useState(settings.site_name || "PromoCuts");
    const [siteTagline, setSiteTagline] = useState(settings.site_tagline || "");
    const [siteDescription, setSiteDescription] = useState(
        settings.site_description || "",
    );
    const [footerText, setFooterText] = useState(
        settings.footer_text || "PromoCuts — Todos os direitos reservados.",
    );

    // Paleta Dual-Theme
    const [primaryLight, setPrimaryLight] = useState(
        settings.primary_color_light || "#10B981",
    );
    const [secondaryLight, setSecondaryLight] = useState(
        settings.secondary_color_light || "#6366F1",
    );
    const [primaryDark, setPrimaryDark] = useState(
        settings.primary_color_dark || "#10B981",
    );
    const [secondaryDark, setSecondaryDark] = useState(
        settings.secondary_color_dark || "#6366F1",
    );

    // Ativos Visuais
    const [logoUrlLight, setLogoUrlLight] = useState(
        settings.logo_url_light || "",
    );
    const [logoUrlDark, setLogoUrlDark] = useState(
        settings.logo_url_dark || "",
    );
    const [logoIconLight, setLogoIconLight] = useState(
        settings.logo_icon_url_light || "",
    );
    const [logoIconDark, setLogoIconDark] = useState(
        settings.logo_icon_url_dark || "",
    );
    const [faviconLight, setFaviconLight] = useState(
        settings.favicon_url_light || "",
    );
    const [faviconDark, setFaviconDark] = useState(
        settings.favicon_url_dark || "",
    );
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFeedback(null);

        const formData = new FormData();
        formData.set("site_name", siteName);
        formData.set("site_tagline", siteTagline);
        formData.set("site_description", siteDescription);
        formData.set("footer_text", footerText);

        formData.set("primary_color_light", primaryLight);
        formData.set("secondary_color_light", secondaryLight);
        formData.set("primary_color_dark", primaryDark);
        formData.set("secondary_color_dark", secondaryDark);

        formData.set("logo_url_light", logoUrlLight);
        formData.set("logo_url_dark", logoUrlDark);
        formData.set("logo_icon_url_light", logoIconLight);
        formData.set("logo_icon_url_dark", logoIconDark);
        formData.set("favicon_url_light", faviconLight);
        formData.set("favicon_url_dark", faviconDark);

        formData.set("social_instagram", settings.social_instagram || "");
        formData.set("social_tiktok", settings.social_tiktok || "");
        formData.set("social_youtube", settings.social_youtube || "");

        startTransition(async () => {
            const res = await updateSiteSettingsAction(
                { success: false },
                formData,
            );

            if (res.success) {
                setFeedback({
                    type: "success",
                    message: res.message || "Configuracoes salvas com sucesso.",
                });
            } else {
                setFeedback({
                    type: "error",
                    message: res.error || "Erro ao salvar configuracoes.",
                });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {feedback && (
                <div
                    className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                        feedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                    }`}
                >
                    {feedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                        <span className="h-2 w-2 rounded-full bg-red-600 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Secao 1: Identidade da Vitrine */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        <Globe className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Identidade da Vitrine
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Informacoes exibidas no titulo da aba, cabecalho e
                            metadados de compartilhamento.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="site-name"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Nome da Vitrine *
                        </label>
                        <input
                            id="site-name"
                            type="text"
                            required
                            maxLength={100}
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            placeholder="PromoCuts"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="site-tagline"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Slogan / Frase de Efeito
                        </label>
                        <input
                            id="site-tagline"
                            type="text"
                            maxLength={255}
                            value={siteTagline}
                            onChange={(e) => setSiteTagline(e.target.value)}
                            placeholder="Cortes virais e recomendacoes de produtos afiliados"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="site-desc"
                        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                    >
                        Descricao Institucional (SEO e Open Graph)
                    </label>
                    <textarea
                        id="site-desc"
                        rows={2}
                        value={siteDescription}
                        onChange={(e) => setSiteDescription(e.target.value)}
                        placeholder="Encontre os melhores achadinhos e promocoes em videos curtos..."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                </div>

                <div>
                    <label
                        htmlFor="footer-text"
                        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                    >
                        Texto de Direitos Autorais do Rodape
                    </label>
                    <input
                        id="footer-text"
                        type="text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="PromoCuts — Todos os direitos reservados."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                </div>
            </div>

            {/* Secao 2: Paleta de Cores Dual-Theme */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        <Palette className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Paleta de Cores da Marca
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Configure as cores primarias e secundarias para o
                            modo claro e modo escuro.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Modo Claro */}
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                            Modo Claro
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                                    Cor Primaria
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={primaryLight}
                                        onChange={(e) =>
                                            setPrimaryLight(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <input
                                        type="text"
                                        maxLength={7}
                                        value={primaryLight}
                                        onChange={(e) =>
                                            setPrimaryLight(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="flex-1 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                                    Cor Secundaria
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={secondaryLight}
                                        onChange={(e) =>
                                            setSecondaryLight(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <input
                                        type="text"
                                        maxLength={7}
                                        value={secondaryLight}
                                        onChange={(e) =>
                                            setSecondaryLight(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="flex-1 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preview Modo Claro */}
                        <div className="p-3 rounded-lg bg-white border border-zinc-200 text-zinc-900 flex items-center justify-between text-xs mt-2">
                            <span
                                style={{ color: primaryLight }}
                                className="font-semibold font-mono"
                            >
                                R$ 149,90
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    style={{ backgroundColor: secondaryLight }}
                                    className="px-2 py-0.5 rounded text-[10px] text-white font-medium"
                                >
                                    Badge
                                </span>
                                <button
                                    type="button"
                                    style={{ backgroundColor: primaryLight }}
                                    className="px-2.5 py-1 rounded text-white text-xs font-medium"
                                >
                                    Comprar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Modo Escuro */}
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900/60 text-zinc-100 space-y-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            Modo Escuro
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">
                                    Cor Primaria
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={primaryDark}
                                        onChange={(e) =>
                                            setPrimaryDark(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <input
                                        type="text"
                                        maxLength={7}
                                        value={primaryDark}
                                        onChange={(e) =>
                                            setPrimaryDark(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="flex-1 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">
                                    Cor Secundaria
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={secondaryDark}
                                        onChange={(e) =>
                                            setSecondaryDark(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
                                    />
                                    <input
                                        type="text"
                                        maxLength={7}
                                        value={secondaryDark}
                                        onChange={(e) =>
                                            setSecondaryDark(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="flex-1 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preview Modo Escuro */}
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 flex items-center justify-between text-xs mt-2">
                            <span
                                style={{ color: primaryDark }}
                                className="font-semibold font-mono"
                            >
                                R$ 149,90
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    style={{ backgroundColor: secondaryDark }}
                                    className="px-2 py-0.5 rounded text-[10px] text-white font-medium"
                                >
                                    Badge
                                </span>
                                <button
                                    type="button"
                                    style={{ backgroundColor: primaryDark }}
                                    className="px-2.5 py-1 rounded text-white text-xs font-medium"
                                >
                                    Comprar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secao 3: Ativos Visuais (PNG ou SVG) */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Logotipos e Icones da Marca
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Formatos aceitos: estritamente PNG ou SVG. Cole a
                            URL ou faca upload direto.
                        </p>
                    </div>
                </div>

                {/* Logotipo Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AssetInput
                        label="Logotipo Principal (Modo Claro)"
                        description="Exibida no cabecalho desktop"
                        name="logo_url_light"
                        value={logoUrlLight}
                        onChange={setLogoUrlLight}
                    />

                    <AssetInput
                        label="Logotipo Principal (Modo Escuro)"
                        description="Fallback automatico para versao clara se omitida"
                        name="logo_url_dark"
                        value={logoUrlDark}
                        onChange={setLogoUrlDark}
                    />
                </div>

                {/* Icone Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AssetInput
                        label="Icone Compacto Mobile (Modo Claro)"
                        description="Exibido na barra superior em smartphones"
                        name="logo_icon_url_light"
                        value={logoIconLight}
                        onChange={setLogoIconLight}
                    />

                    <AssetInput
                        label="Icone Compacto Mobile (Modo Escuro)"
                        description="Fallback automatico se omitido"
                        name="logo_icon_url_dark"
                        value={logoIconDark}
                        onChange={setLogoIconDark}
                    />
                </div>

                {/* Favicons da Aba do Navegador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AssetInput
                        label="Favicon da Aba (Tema Claro)"
                        description="Exibido na aba do navegador em modo claro"
                        name="favicon_url_light"
                        value={faviconLight}
                        onChange={setFaviconLight}
                    />

                    <AssetInput
                        label="Favicon da Aba (Tema Escuro)"
                        description="Exibido na aba do navegador em modo escuro"
                        name="favicon_url_dark"
                        value={faviconDark}
                        onChange={setFaviconDark}
                    />
                </div>
            </div>

            {/* Barra Inferior com Botao de Salvar */}
            <div className="flex items-center justify-end gap-3 sticky bottom-4 p-4 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200 dark:border-zinc-800 shadow-lg">
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Salvar Configuracoes da Marca
                </button>
            </div>
        </form>
    );
}
