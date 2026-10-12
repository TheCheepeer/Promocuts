"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import {
    X,
    Loader2,
    Save,
    AlertCircle,
    Store,
    Smartphone,
    Search,
    ChevronDown,
    Check,
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

    // Controle de pesquisa e menu de plataformas
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Sincroniza estado com o link em edição sempre que o modal abrir ou alternar
    useEffect(() => {
        if (isOpen) {
            setPlatform(linkToEdit?.platform || "instagram");
            setUrl(linkToEdit?.url || "");
            setShowInStorefront(linkToEdit?.show_in_storefront ?? true);
            setShowInBio(linkToEdit?.show_in_bio ?? true);
            setIsActive(linkToEdit?.is_active ?? true);
            setErrorMessage(null);
            setIsDropdownOpen(false);
            setSearchQuery("");
        }
    }, [isOpen, linkToEdit]);

    const selectedStrategy = getSocialPlatform(platform);

    const filteredPlatforms = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return SOCIAL_PLATFORMS;
        return SOCIAL_PLATFORMS.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.id.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query),
        );
    }, [searchQuery]);

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

    if (!isOpen) return null;

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
                    {/* Seletor Pesquisável de Plataforma */}
                    <div>
                        <label
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                            Plataforma
                        </label>
                        <div className="mt-1.5 relative">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                className="w-full flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 transition-colors hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 cursor-pointer shadow-2xs"
                                aria-expanded={isDropdownOpen}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs"
                                        style={{ backgroundColor: selectedStrategy.brandColor }}
                                    >
                                        <SocialIcon platform={platform} className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-semibold truncate">{selectedStrategy.name}</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                                        {selectedStrategy.category}
                                    </span>
                                </div>
                                <ChevronDown
                                    className={`h-4 w-4 text-zinc-400 transition-transform ${
                                        isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute z-30 mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 animate-in fade-in-50 zoom-in-95">
                                    {/* Campo de Busca Rápida */}
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                            type="text"
                                            autoFocus
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Filtrar por nome da plataforma..."
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                                        />
                                    </div>

                                    {/* Lista de Opções com Rolagem Suave */}
                                    <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                                        {filteredPlatforms.length === 0 ? (
                                            <p className="p-3 text-center text-xs text-zinc-400">
                                                Nenhuma plataforma encontrada.
                                            </p>
                                        ) : (
                                            filteredPlatforms.map((p) => {
                                                const isSelected = p.id === platform;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setPlatform(p.id);
                                                            setIsDropdownOpen(false);
                                                            setSearchQuery("");
                                                        }}
                                                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? "bg-zinc-100 text-zinc-900 font-bold dark:bg-zinc-700 dark:text-zinc-50"
                                                                : "hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div
                                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white shadow-2xs"
                                                                style={{ backgroundColor: p.brandColor }}
                                                            >
                                                                <SocialIcon platform={p.id} className="h-3 w-3" />
                                                            </div>
                                                            <span className="truncate">{p.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                                                {p.category}
                                                            </span>
                                                            {isSelected && (
                                                                <Check className="h-3.5 w-3.5 text-brand-primary" />
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
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
                            Você pode colar a URL completa ou apenas o @usuário. A plataforma é detectada automaticamente ao colar.
                        </p>
                    </div>

                    {/* Pré-visualização do Ícone */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs overflow-hidden"
                            style={{ backgroundColor: selectedStrategy.brandColor }}
                        >
                            <SocialIcon platform={platform} url={url} className="h-4.5 w-4.5" />
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
