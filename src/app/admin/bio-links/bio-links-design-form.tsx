"use client";

import React, { useState, useTransition } from "react";
import {
    Save,
    Loader2,
    CheckCircle2,
    Palette,
    Sparkles,
    QrCode,
    LayoutTemplate,
    Tv,
    EyeOff,
    ExternalLink,
} from "lucide-react";
import { AssetInput } from "@/components/ui/asset-input";
import { updateBioLinksDesignAction } from "./actions";
import type { SiteSettings, BioStorefrontBannerStyle } from "@/types/database";

interface BioLinksDesignFormProps {
    settings: SiteSettings;
}

export function BioLinksDesignForm({ settings }: BioLinksDesignFormProps) {
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // Identidade do Bio Links
    const [avatarLight, setAvatarLight] = useState(
        settings.bio_avatar_url_light || "",
    );
    const [avatarDark, setAvatarDark] = useState(
        settings.bio_avatar_url_dark || "",
    );
    const [bioTitle, setBioTitle] = useState(
        settings.bio_title || "",
    );
    const [bioDescription, setBioDescription] = useState(
        settings.bio_description || "",
    );

    // Cartaz da Vitrine
    const [bannerStyle, setBannerStyle] = useState<BioStorefrontBannerStyle>(
        settings.bio_show_storefront_banner || "banner",
    );

    // QR Code
    const [showQrCode, setShowQrCode] = useState(
        settings.bio_show_qrcode !== false,
    );

    // Cores Opcionais da Bio
    const [primaryLight, setPrimaryLight] = useState(
        settings.bio_primary_color_light || settings.primary_color_light || "#10B981",
    );
    const [primaryDark, setPrimaryDark] = useState(
        settings.bio_primary_color_dark || settings.primary_color_dark || "#10B981",
    );
    const [useCustomColors, setUseCustomColors] = useState(
        Boolean(settings.bio_primary_color_light || settings.bio_primary_color_dark),
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFeedback(null);

        const formData = new FormData();
        formData.append("bio_avatar_url_light", avatarLight);
        formData.append("bio_avatar_url_dark", avatarDark);
        formData.append("bio_show_storefront_banner", bannerStyle);
        formData.append("bio_show_qrcode", showQrCode ? "true" : "false");
        formData.append("bio_title", bioTitle);
        formData.append("bio_description", bioDescription);

        if (useCustomColors) {
            formData.append("bio_primary_color_light", primaryLight);
            formData.append("bio_primary_color_dark", primaryDark);
        } else {
            formData.append("bio_primary_color_light", "");
            formData.append("bio_primary_color_dark", "");
        }

        startTransition(async () => {
            const res = await updateBioLinksDesignAction(
                { success: false },
                formData,
            );
            if (res.success) {
                setFeedback({
                    type: "success",
                    message:
                        res.message ||
                        "Personalização visual salva com sucesso.",
                });
            } else {
                setFeedback({
                    type: "error",
                    message:
                        res.error || "Ocorreu um erro ao salvar as configurações.",
                });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {feedback && (
                <div
                    className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
                        feedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60"
                    }`}
                >
                    {feedback.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <Sparkles className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <p className="flex-1">{feedback.message}</p>
                </div>
            )}

            {/* SEÇÃO 1: FOTO DE PERFIL E TEXTOS */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-800 dark:text-neutral-200">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                            Foto de Perfil & Textos da Bio
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Configure imagem dedicada e biografia para o topo da página agregadora de links.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AssetInput
                        label="Foto de Perfil (Modo Claro)"
                        description="Imagem redonda exibida no tema claro. Se não informada, usa o ícone/logo cadastrado nas configurações gerais."
                        value={avatarLight}
                        onChange={setAvatarLight}
                        name="bio_avatar_url_light"
                        aspectRatio="square"
                        placeholder="https://... ou faça upload"
                        uploadTitle="Enviar foto de perfil (claro)"
                    />

                    <AssetInput
                        label="Foto de Perfil (Modo Escuro)"
                        description="Imagem dedicada para o tema escuro. Se vazia, herda a foto do tema claro ou as logos da vitrine."
                        value={avatarDark}
                        onChange={setAvatarDark}
                        name="bio_avatar_url_dark"
                        aspectRatio="square"
                        placeholder="https://... ou faça upload"
                        uploadTitle="Enviar foto de perfil (escuro)"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                            Título da Bio (Opcional)
                        </label>
                        <input
                            type="text"
                            value={bioTitle}
                            onChange={(e) => setBioTitle(e.target.value)}
                            placeholder={settings.site_name || "Ex: PromoCuts — Melhores Ofertas"}
                            maxLength={100}
                            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                        />
                        <p className="text-[11px] text-neutral-500">
                            Se vazio, exibirá o nome da vitrine: &ldquo;{settings.site_name}&rdquo;.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                Biografia / Descrição Curta
                            </label>
                            <span className="text-[11px] text-neutral-400">
                                {bioDescription.length}/500
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={bioDescription}
                            onChange={(e) => setBioDescription(e.target.value)}
                            placeholder={settings.site_description || "Acompanhe nossos grupos e achados recomendados diariamente!"}
                            maxLength={500}
                            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white resize-none"
                        />
                        <p className="text-[11px] text-neutral-500">
                            Texto exibido logo abaixo do avatar na visualização dos links.
                        </p>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 2: ESTILO DO CARTAZ DA VITRINE */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-800 dark:text-neutral-200">
                        <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                            Cartaz da Vitrine de Cortes
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Escolha como apresentar o acesso aos vídeos de cortes no feed de Bio Links.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Opção Destaque */}
                    <div
                        onClick={() => setBannerStyle("banner")}
                        className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                            bannerStyle === "banner"
                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs ring-2 ring-emerald-500/20"
                                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/40"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                Destaque Amplo
                            </span>
                            <Tv className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                            Banner Principal
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            Cartaz visual expandido com gradiente, miniatura de vídeo em destaque e botão de ação rápida &ldquo;Assistir Vídeos&rdquo;.
                        </p>
                    </div>

                    {/* Opção Compacto */}
                    <div
                        onClick={() => setBannerStyle("compact")}
                        className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                            bannerStyle === "compact"
                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs ring-2 ring-emerald-500/20"
                                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/40"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                                Compacto
                            </span>
                            <ExternalLink className="w-4 h-4 text-neutral-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                            Card na Lista
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            Apresentado com a mesma dimensão dos links normais, com ícone de reprodução e selo sutil de vitrine.
                        </p>
                    </div>

                    {/* Opção Oculto */}
                    <div
                        onClick={() => setBannerStyle("hidden")}
                        className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                            bannerStyle === "hidden"
                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs ring-2 ring-emerald-500/20"
                                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/40"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                                Desativado
                            </span>
                            <EyeOff className="w-4 h-4 text-neutral-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                            Ocultar Vitrine
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            Remove o cartaz da vitrine de vídeos, exibindo estritamente a lista de links e redes do criador.
                        </p>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 3: QR CODE E INTERATIVIDADE DESKTOP */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-800 dark:text-neutral-200">
                        <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                            Widget Flutuante de QR Code no Desktop
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Permite aos visitantes em computadores lerem o código com o celular para abrir a página de links instantaneamente.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="space-y-0.5">
                        <label
                            htmlFor="toggle-bio-qrcode"
                            className="text-sm font-semibold text-neutral-900 dark:text-white cursor-pointer"
                        >
                            Exibir card de QR Code lateral no Desktop
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Renderiza um QR Code em SVG puro (sem consumo de rede ou dependências) ao lado do feed centralizado.
                        </p>
                    </div>
                    <input
                        id="toggle-bio-qrcode"
                        type="checkbox"
                        checked={showQrCode}
                        onChange={(e) => setShowQrCode(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded-md border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500 cursor-pointer"
                    />
                </div>
            </div>

            {/* SEÇÃO 4: CORES PERSONALIZADAS (OPCIONAL) */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-800 dark:text-neutral-200">
                            <Palette className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                                Cores do Bio Links
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Por padrão, utiliza as cores da vitrine ({settings.primary_color_light}). Ative para definir uma paleta exclusiva.
                            </p>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        <input
                            type="checkbox"
                            checked={useCustomColors}
                            onChange={(e) => setUseCustomColors(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded-md border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500 cursor-pointer"
                        />
                        Cor personalizada
                    </label>
                </div>

                {useCustomColors && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                Modo Claro
                            </span>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={primaryLight}
                                    onChange={(e) => setPrimaryLight(e.target.value.toUpperCase())}
                                    className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0.5 bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={primaryLight}
                                    onChange={(e) => setPrimaryLight(e.target.value.toUpperCase())}
                                    maxLength={7}
                                    className="w-28 px-3 py-1.5 text-xs font-mono uppercase bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                Modo Escuro
                            </span>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={primaryDark}
                                    onChange={(e) => setPrimaryDark(e.target.value.toUpperCase())}
                                    className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0.5 bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={primaryDark}
                                    onChange={(e) => setPrimaryDark(e.target.value.toUpperCase())}
                                    maxLength={7}
                                    className="w-28 px-3 py-1.5 text-xs font-mono uppercase bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTÃO DE SALVAMENTO */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 text-white font-medium rounded-xl transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Salvando Alterações...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>Salvar Personalização</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
