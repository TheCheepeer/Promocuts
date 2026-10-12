"use client";

import React, { useState, useTransition } from "react";
import {
    X,
    Loader2,
    Save,
    ExternalLink,
    AlertCircle,
} from "lucide-react";
import {
    BioLinkIcon,
    BIO_LINK_AVAILABLE_ICONS,
} from "./bio-link-icons";
import { BioLinkIconSelector } from "./bio-link-icon-selector";
import { detectPlatformFromUrl } from "@/lib/social/strategies";
import { createBioLinkAction, updateBioLinkAction } from "./actions";
import type { BioLink } from "@/types/database";

interface BioLinkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    linkToEdit?: BioLink | null;
}

const PRESET_BADGES = ["AO VIVO", "GRUPO VIP", "COMUNIDADE", "APOIE", "NOVO", "DESCONTO"];

export function BioLinkDialog({
    isOpen,
    onClose,
    linkToEdit,
}: BioLinkDialogProps) {
    const isEditing = Boolean(linkToEdit);
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [title, setTitle] = useState(linkToEdit?.title || "");
    const [url, setUrl] = useState(linkToEdit?.url || "");
    const [icon, setIcon] = useState(linkToEdit?.icon || "link");
    const [badgeText, setBadgeText] = useState(linkToEdit?.badge_text || "");
    const [isHighlighted, setIsHighlighted] = useState(
        linkToEdit?.is_highlighted || false,
    );
    const [isActive, setIsActive] = useState(linkToEdit?.is_active ?? true);

    if (!isOpen) return null;

    const selectedIconOption =
        BIO_LINK_AVAILABLE_ICONS.find((i) => i.id === icon) ||
        BIO_LINK_AVAILABLE_ICONS[BIO_LINK_AVAILABLE_ICONS.length - 1];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        const formData = new FormData();
        formData.set("title", title);
        formData.set("url", url);
        formData.set("icon", icon);
        formData.set("badge_text", badgeText);
        formData.set("is_highlighted", isHighlighted ? "true" : "false");
        formData.set("is_active", isActive ? "true" : "false");

        startTransition(async () => {
            const res = isEditing && linkToEdit
                ? await updateBioLinkAction(linkToEdit.id, { success: false }, formData)
                : await createBioLinkAction({ success: false }, formData);

            if (res.success) {
                onClose();
            } else {
                setErrorMessage(res.error || "Ocorreu um erro ao salvar o link.");
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
            <div className="relative z-10 w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {isEditing ? "Editar Bio Link" : "Novo Bio Link ou Comunidade"}
                        </h2>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {isEditing
                                ? "Atualize as informações, ícone ou crachá de destaque."
                                : "Adicione canal de live, comunidade fechada ou página externa."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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

                {/* Pré-visualização em Tempo Real */}
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Pré-visualização na Vitrine
                    </span>
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                                style={{ backgroundColor: selectedIconOption.brandColor }}
                            >
                                <BioLinkIcon name={icon} className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {title || "Título do Link"}
                                    </span>
                                    {badgeText && (
                                        <span
                                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white shadow-xs ${
                                                isHighlighted
                                                    ? "bg-red-600 animate-pulse"
                                                    : "bg-brand-primary"
                                            }`}
                                        >
                                            {badgeText}
                                        </span>
                                    )}
                                </div>
                                <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
                                    {url || "https://..."}
                                </span>
                            </div>
                        </div>

                        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" />
                    </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Título */}
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                            Título do Link *
                        </label>
                        <input
                            id="title"
                            type="text"
                            required
                            maxLength={100}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Canal na Twitch, Grupo VIP no Telegram, Lives diárias..."
                            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label
                            htmlFor="url"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                            URL de Destino *
                        </label>
                        <input
                            id="url"
                            type="url"
                            required
                            value={url}
                            onChange={(e) => {
                                const newUrl = e.target.value;
                                setUrl(newUrl);
                                const detected = detectPlatformFromUrl(newUrl);
                                if (detected) {
                                    setIcon(detected.id);
                                    if (!title) {
                                        setTitle(detected.name);
                                    }
                                }
                            }}
                            placeholder="https://..."
                            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 font-mono text-xs"
                        />
                    </div>

                    {/* Seletor de Ícones Otimizado com Memoização e Categorias */}
                    <BioLinkIconSelector
                        selectedIcon={icon}
                        onSelectIcon={setIcon}
                    />

                    {/* Crachá de Destaque */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="badgeText"
                                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                            >
                                Crachá de Destaque (Badge)
                            </label>
                            <span className="text-[11px] text-zinc-400">Opcional</span>
                        </div>
                        <input
                            id="badgeText"
                            type="text"
                            maxLength={50}
                            value={badgeText}
                            onChange={(e) => setBadgeText(e.target.value)}
                            placeholder="Ex: AO VIVO, VIP, COMUNIDADE..."
                            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        {/* Atalhos Rápidos de Crachá */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {PRESET_BADGES.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setBadgeText(preset)}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                                        badgeText === preset
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                            {badgeText && (
                                <button
                                    type="button"
                                    onClick={() => setBadgeText("")}
                                    className="px-2 py-0.5 rounded-md text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Opções de Destaque e Visibilidade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={isHighlighted}
                                onChange={(e) => setIsHighlighted(e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <div>
                                <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    Destaque Pulsante
                                </span>
                                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Animação de atenção na vitrine
                                </span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <div>
                                <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    Link Ativo
                                </span>
                                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Exibir imediatamente na vitrine
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
                            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEditing ? "Salvar Alterações" : "Cadastrar Link"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
