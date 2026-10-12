"use client";

import React, { useState, useTransition } from "react";
import {
    X,
    Loader2,
    Save,
    AlertCircle,
    Store,
    Smartphone,
} from "lucide-react";
import {
    SOCIAL_PLATFORMS,
    getSocialPlatform,
    detectPlatformFromUrl,
} from "@/lib/social/strategies";
import { SocialIcon } from "@/components/public/social-icon";
import { createSocialLinkAction, updateSocialLinkAction } from "./actions";
import type { BrandSocialLink } from "@/types/database";

interface SocialLinkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    linkToEdit?: BrandSocialLink | null;
}

export function SocialLinkDialog({
    isOpen,
    onClose,
    linkToEdit,
}: SocialLinkDialogProps) {
    const isEditing = Boolean(linkToEdit);
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [platform, setPlatform] = useState(linkToEdit?.platform || "instagram");
    const [url, setUrl] = useState(linkToEdit?.url || "");
    const [showInStorefront, setShowInStorefront] = useState(
        linkToEdit?.show_in_storefront ?? true,
    );
    const [showInBio, setShowInBio] = useState(linkToEdit?.show_in_bio ?? true);
    const [isActive, setIsActive] = useState(linkToEdit?.is_active ?? true);

    if (!isOpen) return null;

    const selectedStrategy = getSocialPlatform(platform);

    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl);
        const detected = detectPlatformFromUrl(newUrl);
        if (detected && detected.id !== platform) {
            setPlatform(detected.id);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        const formData = new FormData();
        formData.set("platform", platform);
        formData.set("url", url);
        formData.set("show_in_storefront", showInStorefront ? "true" : "false");
        formData.set("show_in_bio", showInBio ? "true" : "false");
        formData.set("is_active", isActive ? "true" : "false");

        startTransition(async () => {
            const res = isEditing && linkToEdit
                ? await updateSocialLinkAction(linkToEdit.id, { success: false }, formData)
                : await createSocialLinkAction({ success: false }, formData);

            if (res.success) {
                onClose();
            } else {
                setErrorMessage(res.error || "Erro ao salvar a rede social.");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {isEditing ? "Editar Rede Social" : "Nova Rede Social da Marca"}
                        </h2>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Configure o canal oficial e defina onde ele será exibido aos visitantes.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                        aria-label="Fechar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Mensagem de Erro */}
                {errorMessage && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Seletor de Plataforma */}
                    <div>
                        <label
                            htmlFor="social-platform"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                            Plataforma
                        </label>
                        <div className="mt-1.5 relative">
                            <select
                                id="social-platform"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 cursor-pointer"
                            >
                                {SOCIAL_PLATFORMS.filter((p) => p.id !== "link").map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* URL ou Handle */}
                    <div>
                        <label
                            htmlFor="social-url"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                            URL ou Perfil *
                        </label>
                        <input
                            id="social-url"
                            type="text"
                            required
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder={selectedStrategy.placeholder}
                            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                        />
                        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                            Você pode colar a URL completa ou apenas o @usuário.
                        </p>
                    </div>

                    {/* Pré-visualização do Ícone */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                            style={{ backgroundColor: selectedStrategy.brandColor }}
                        >
                            <SocialIcon platform={platform} className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1 text-xs">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                                {selectedStrategy.name}
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400 truncate block font-mono text-[11px]">
                                {url ? selectedStrategy.formatUrl(url) : "Preencha o perfil acima"}
                            </span>
                        </div>
                    </div>

                    {/* Controles Granulares de Visibilidade */}
                    <div className="pt-2 space-y-2.5">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                            Locais de Exibição
                        </span>

                        {/* Visibilidade na Vitrine */}
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={showInStorefront}
                                onChange={(e) => setShowInStorefront(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Store className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                        Exibir no Cabeçalho da Vitrine
                                    </span>
                                </div>
                                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Ícone visível no topo da página inicial e categorias de cortes.
                                </span>
                            </div>
                        </label>

                        {/* Visibilidade no Bio Links */}
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={showInBio}
                                onChange={(e) => setShowInBio(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Smartphone className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                        Exibir no Perfil de Bio Links
                                    </span>
                                </div>
                                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Ícone visível abaixo da foto de perfil na página dedicada /links.
                                </span>
                            </div>
                        </label>

                        {/* Status Ativo */}
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <div>
                                <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    Canal Ativo
                                </span>
                                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Habilitar publicação pública imediata.
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    <span>{isEditing ? "Salvar Alterações" : "Adicionar Rede"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
