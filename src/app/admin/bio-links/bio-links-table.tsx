"use client";

import React, { useState, useTransition } from "react";
import {
    ArrowUp,
    ArrowDown,
    Edit2,
    Trash2,
    ExternalLink,
    Loader2,
    MousePointerClick,
    Plus,
    AlertCircle,
    Check,
} from "lucide-react";
import {
    BioLinkIcon,
    BIO_LINK_AVAILABLE_ICONS,
} from "./bio-link-icons";
import { BioLinkDialog } from "./bio-link-dialog";
import {
    deleteBioLinkAction,
    toggleBioLinkActiveAction,
    reorderBioLinksAction,
} from "./actions";
import type { BioLink } from "@/types/database";

interface BioLinksTableProps {
    initialLinks: BioLink[];
}

export function BioLinksTable({ initialLinks }: BioLinksTableProps) {
    const [links, setLinks] = useState<BioLink[]>(initialLinks);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<BioLink | null>(null);
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // Atualiza estado local quando as props mudarem
    React.useEffect(() => {
        setLinks(initialLinks);
    }, [initialLinks]);

    const handleOpenCreate = () => {
        setEditingLink(null);
        setDialogOpen(true);
    };

    const handleOpenEdit = (link: BioLink) => {
        setEditingLink(link);
        setDialogOpen(true);
    };

    const handleToggleActive = (link: BioLink) => {
        const nextState = !link.is_active;
        // Otimista
        setLinks((prev) =>
            prev.map((item) =>
                item.id === link.id ? { ...item, is_active: nextState } : item,
            ),
        );

        startTransition(async () => {
            const res = await toggleBioLinkActiveAction(link.id, nextState);
            if (!res.success) {
                // Reverte em caso de falha
                setLinks((prev) =>
                    prev.map((item) =>
                        item.id === link.id ? { ...item, is_active: link.is_active } : item,
                    ),
                );
                setFeedback({ type: "error", message: res.error || "Erro ao alterar visibilidade." });
            }
        });
    };

    const handleMove = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= links.length) return;

        const newLinks = [...links];
        const [movedItem] = newLinks.splice(index, 1);
        newLinks.splice(targetIndex, 0, movedItem);

        // Atualiza estado local
        setLinks(newLinks);

        startTransition(async () => {
            const orderedIds = newLinks.map((l) => l.id);
            const res = await reorderBioLinksAction(orderedIds);
            if (!res.success) {
                setLinks(initialLinks);
                setFeedback({ type: "error", message: res.error || "Erro ao reordenar links." });
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const res = await deleteBioLinkAction(id);
            if (res.success) {
                setLinks((prev) => prev.filter((item) => item.id !== id));
                setDeleteModalId(null);
                setFeedback({ type: "success", message: "Link excluído com sucesso." });
            } else {
                setFeedback({ type: "error", message: res.error || "Falha ao excluir o link." });
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Feedback temporário */}
            {feedback && (
                <div
                    className={`flex items-center justify-between rounded-xl p-3 text-xs ${
                        feedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                            : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {feedback.type === "success" ? (
                            <Check className="h-4 w-4 shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{feedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="text-xs opacity-70 hover:opacity-100"
                    >
                        Fechar
                    </button>
                </div>
            )}

            {/* Ações superiores */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {links.length} {links.length === 1 ? "link cadastrado" : "links cadastrados"}
                </span>
                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-xs"
                >
                    <Plus className="h-4 w-4" />
                    Novo Bio Link
                </button>
            </div>

            {/* Tabela ou Estado Vazio */}
            {links.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                        <MousePointerClick className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Nenhum bio link cadastrado
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                        Cadastre seus links de redes sociais, lives da Twitch/Kick, servidor no Discord ou PIX para exibir na vitrine.
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-xs"
                    >
                        <Plus className="h-4 w-4" />
                        Cadastrar Primeiro Link
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-100 bg-zinc-50/75 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                                <tr>
                                    <th className="py-3 px-3 w-16 text-center">Ordem</th>
                                    <th className="py-3 px-4">Link e Plataforma</th>
                                    <th className="py-3 px-3">Crachá</th>
                                    <th className="py-3 px-3 text-center">Cliques</th>
                                    <th className="py-3 px-3 text-center">Visibilidade</th>
                                    <th className="py-3 px-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {links.map((link, index) => {
                                    const iconOption =
                                        BIO_LINK_AVAILABLE_ICONS.find((i) => i.id === link.icon) ||
                                        BIO_LINK_AVAILABLE_ICONS[BIO_LINK_AVAILABLE_ICONS.length - 1];

                                    return (
                                        <tr
                                            key={link.id}
                                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                                        >
                                            {/* Ordem */}
                                            <td className="py-3 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMove(index, "up")}
                                                        disabled={index === 0 || isPending}
                                                        className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20"
                                                        aria-label="Mover para cima"
                                                    >
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMove(index, "down")}
                                                        disabled={index === links.length - 1 || isPending}
                                                        className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20"
                                                        aria-label="Mover para baixo"
                                                    >
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Link e Plataforma */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                                                        style={{ backgroundColor: iconOption.brandColor }}
                                                    >
                                                        <BioLinkIcon name={link.icon} className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block font-semibold text-zinc-900 truncate dark:text-zinc-100">
                                                            {link.title}
                                                        </span>
                                                        <a
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 truncate max-w-xs"
                                                        >
                                                            <span className="truncate">{link.url}</span>
                                                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Crachá */}
                                            <td className="py-3 px-3">
                                                {link.badge_text ? (
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white shadow-xs ${
                                                            link.is_highlighted
                                                                ? "bg-red-600 animate-pulse"
                                                                : "bg-brand-primary"
                                                        }`}
                                                    >
                                                        {link.badge_text}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-300 dark:text-zinc-700">—</span>
                                                )}
                                            </td>

                                            {/* Cliques */}
                                            <td className="py-3 px-3 text-center">
                                                <span className="inline-flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                                                    <MousePointerClick className="h-3 w-3 text-zinc-400" />
                                                    {link.clicks_count.toLocaleString("pt-BR")}
                                                </span>
                                            </td>

                                            {/* Visibilidade */}
                                            <td className="py-3 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(link)}
                                                    disabled={isPending}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        link.is_active
                                                            ? "bg-emerald-600 dark:bg-emerald-500"
                                                            : "bg-zinc-300 dark:bg-zinc-700"
                                                    }`}
                                                    aria-label={link.is_active ? "Desativar link" : "Ativar link"}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                            link.is_active ? "translate-x-4" : "translate-x-0"
                                                        }`}
                                                    />
                                                </button>
                                            </td>

                                            {/* Ações */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(link)}
                                                        className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
                                                        title="Editar link"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteModalId(link.id)}
                                                        className="p-1.5 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                                                        title="Excluir link"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Cadastro / Edição */}
            <BioLinkDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                linkToEdit={editingLink}
            />

            {/* Modal de Confirmação de Exclusão */}
            {deleteModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        onClick={() => setDeleteModalId(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            Excluir este Bio Link?
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Esta ação removerá o link imediatamente da vitrine pública e não poderá ser desfeita.
                        </p>
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModalId(null)}
                                className="rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteModalId)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirmar Exclusão"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
